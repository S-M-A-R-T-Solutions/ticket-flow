const { Client, Ticket, TwilioTranscription, TwilioCall, TwilioRecording, Location, LocationPhoneNumber } = require('@db/models');
const sq = require('../db/models').sequelize;
const generateAlphanumericId = require('./randomGenerator');
const twilioConfig = require('../config/twilio');
const { Op } = require('sequelize');
const { getTitleAndDescription } = require('./openai');

const axios = require('axios');
const { Buffer } = require('buffer');
const fs = require('fs');
const FormData = require("form-data");

/* -----------------------------
   Structured logs helpers
-------------------------------- */
function logExtOk(service, step, ctx = {}, extra = {}) {
    console.info(JSON.stringify({
        level: "info",
        type: "external_ok",
        service,
        step,
        ...ctx,
        ...extra,
        ts: new Date().toISOString(),
    }));
}

function logExtFail(service, step, err, ctx = {}) {
    console.error(JSON.stringify({
        level: "error",
        type: "external_fail",
        service,
        step,
        ...ctx,
        status: err?.response?.status,
        code: err?.code,
        message: err?.message,
        response: err?.response?.data,
        ts: new Date().toISOString(),
    }));
}

async function bestEffort(service, step, ctx, fn) {
    try {
        const result = await fn();
        logExtOk(service, step, ctx);
        return { ok: true, result };
    } catch (err) {
        logExtFail(service, step, err, ctx);
        return { ok: false, error: err };
    }
}

/* -----------------------------
   Core functions
-------------------------------- */

async function upsertCallAndTicket(req) {
    const {
        Called,
        CallSid,
        To,
        CallStatus,
        From,
        CallDuration,
        AccountSid,
        ApplicationSid,
        Caller,
    } = req.body;

    const clientPhone = From || Caller;
    const ctx = { CallSid, clientPhone };

    // 1) Si la llamada ya existe, solo update local (no dependas de externos)
    let callEntry = await TwilioCall.findOne({ where: { callSid: CallSid } });

    if (callEntry) {
        await callEntry.update({
            callStatus: CallStatus || callEntry.callStatus,
            callDuration: CallDuration || callEntry.callDuration,
        });
        return { success: true, created: false };
    }

    // 2) Buscar cliente (local)
    let clientByPhone = await Client.findOne({ where: { phone: clientPhone } });

    if (!clientByPhone) {
        const locationPhone = await LocationPhoneNumber.findOne({
            where: { phoneNumber: clientPhone },
            include: { model: Location, attributes: ['id', 'clientId'] },
        });

        if (locationPhone && locationPhone.Location) {
            clientByPhone = await Client.findByPk(locationPhone.Location.clientId);
        }
    }

    if (!clientByPhone) {
        clientByPhone = await Client.findByPk(twilioConfig.anonymousClientId);
    }

    if (!clientByPhone) {
        // Esto ya es local/config. Si falta, log y sal sin tumbar nada.
        console.error(JSON.stringify({
            level: "error",
            type: "config_fail",
            message: "Anonymous client missing in DB",
            ...ctx,
            ts: new Date().toISOString(),
        }));
        return { success: false, created: false, reason: "anonymous_client_missing" };
    }

    // 3) Crear ticket local (rápido)
    const ticket = await Ticket.create({
        title: '',
        description: '',
        checkIn: null,
        checkOut: null,
        clientId: clientByPhone.id,
        statusId: 1,
        hashedId: generateAlphanumericId(10),
        createdBy: twilioConfig.autoUserId,
    });

    // 4) Crear TwilioCall local inmediatamente (ticketId nunca null)
    callEntry = await TwilioCall.create({
        ticketId: ticket.id,
        callSid: CallSid,
        called: Called,
        from: From,
        to: To,
        callStatus: CallStatus,
        callDuration: CallDuration || 0,
        accountSid: AccountSid,
        applicationSid: ApplicationSid,
        caller: Caller,
    });

    const ctx2 = { ...ctx, ticketId: ticket.id, clientId: clientByPhone.id };

    // 5) Crear ticket en Freshservice (BEST-EFFORT)
    const freshdeskAuth = Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString("base64");

    const createRes = await bestEffort("freshservice", "create_ticket", ctx2, async () => {
        const fdResponse = await fetch(`${process.env.FRESHDESK_URL}/api/v2/tickets`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${freshdeskAuth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                subject: `New Call Ticket - ${clientPhone}`,
                description: `Ticket created for call from ${clientPhone}. Local Ticket ID: ${ticket.id}`,
                email: clientByPhone.email || '',
                phone: clientPhone || '',
                priority: 1,
                status: 2,
            })
        });

        if (!fdResponse.ok) {
            const errText = await fdResponse.text().catch(() => '');
            const err = new Error(`Freshservice create failed: ${fdResponse.status}`);
            err.response = { status: fdResponse.status, data: errText };
            throw err;
        }

        return fdResponse.json();
    });

    if (createRes.ok) {
        const fdData = createRes.result;
        const freshId = fdData?.ticket?.id || fdData?.id;

        if (freshId) {
            ticket.freshdeskId = freshId;
            await ticket.save();
            logExtOk("freshservice", "link_local_ticket", { ...ctx2, freshdeskId: freshId });
        }
    }

    return {
        success: true,
        created: true,
        anonymous: clientByPhone.id === twilioConfig.anonymousClientId,
    };
}

async function insertTranscription(req) {
    const {
        TranscriptionSid,
        TranscriptionEvent,
        CallSid,
        Timestamp,
        AccountSid,
        SequenceId,
        Final,
        TranscriptionData,
        Track,
    } = req.body;

    const call = await TwilioCall.findOne({ where: { callSid: CallSid } });

    if (!call) {
        console.error(JSON.stringify({
            level: "error",
            type: "db_missing",
            message: `Call with SID ${CallSid} not found`,
            CallSid,
            ts: new Date().toISOString(),
        }));
        return false;
    }

    try {
        await TwilioTranscription.create({
            callId: call.id,
            transcriptionSid: TranscriptionSid,
            callSid: CallSid,
            accountSid: AccountSid,
            timestamp: Timestamp,
            transcriptionEvent: TranscriptionEvent,
            sequenceId: Number(SequenceId) || 0,
            transcriptionData: TranscriptionData || '',
            track: Track || null,
            final: Final === 'true' ? true : false,
        });
    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
}

async function getCompletedTranscriptions(callSid) {
    const transcriptions = await TwilioTranscription.findAll({
        where: {
            callSid: callSid,
            transcriptionData: {
                [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: '' }]
            },
        },
        order: [['sequenceId', 'ASC']],
    });

    if (transcriptions.length === 0) {
        console.info('No transcriptions found for callSid: ' + callSid);
        return null;
    }

    const completed = transcriptions.reduce((acc, curr) => {
        return `${acc}${curr.track}:${curr.transcriptionData}\n`;
    }, '');

    return completed.trim();
}

async function updateTicketWithTranscription(callSid, transcription) {
    const call = await TwilioCall.findOne({ where: { callSid } });
    if (!call) return false;

    const ticket = await Ticket.findByPk(call.ticketId);
    if (!ticket) return false;

    const ctx = { CallSid: callSid, ticketId: ticket.id, freshdeskId: ticket.freshdeskId };

    // 1) OpenAI title/description BEST-EFFORT (fallback si falla)
    let title = 'Call transcription received';
    let description = transcription || '';

    const aiRes = await bestEffort("openai", "title_and_description", ctx, async () => {
        return getTitleAndDescription(transcription);
    });

    if (aiRes.ok && aiRes.result) {
        if (aiRes.result.title) title = aiRes.result.title;
        if (aiRes.result.description) description = aiRes.result.description;
    }

    await ticket.update({
        title: title.slice(0, 50),
        description,
    });

    // 2) Si no hay Freshservice id, listo
    if (!ticket.freshdeskId) return true;

    const freshdeskAuth = Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString("base64");

    // 3) Update ticket en Freshservice BEST-EFFORT
    await bestEffort("freshservice", "update_ticket", ctx, async () => {
        const response = await fetch(`${process.env.FRESHDESK_URL}/api/v2/tickets/${ticket.freshdeskId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Basic ${freshdeskAuth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                description: `Call from ${call.from}. Description: ${description}`,
                subject: title.slice(0, 50)
            })
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            const err = new Error(`Freshservice update failed: ${response.status}`);
            err.response = { status: response.status, data: errText };
            throw err;
        }

        return true;
    });

    // 4) Adjuntar transcription como .txt BEST-EFFORT
    await bestEffort("freshservice", "attach_transcription_txt", ctx, async () => {
        const form = new FormData();
        form.append(
            "attachments[]",
            Buffer.from(transcription || '', 'utf-8'),
            { filename: `Transcription - Ticket ${ticket.id}.txt` }
        );

        const attachResponse = await axios.put(
            `${process.env.FRESHDESK_URL}/api/v2/tickets/${ticket.freshdeskId}`,
            form,
            {
                headers: {
                    "Authorization": `Basic ${freshdeskAuth}`,
                    ...form.getHeaders(),
                },
                timeout: 20000,
            }
        );

        return attachResponse.status;
    });

    return true;
}

async function upsertCallRecording(req) {
    const {
        AccountSid,
        CallSid,
        RecordingSid,
        RecordingUrl,
        RecordingStatus,
        RecordingDuration,
        RecordingStartTime,
        RecordingChannels,
        RecordingSource,
    } = req.body;

    const existingRecording = await TwilioRecording.findOne({ where: { recordingSid: RecordingSid } });

    if (existingRecording) {
        try {
            const updated = await existingRecording.update({
                recordingUrl: RecordingUrl || existingRecording.recordingUrl,
                recordingStatus: RecordingStatus || existingRecording.recordingStatus,
                recordingStartTime: RecordingStartTime || existingRecording.recordingStartTime,
                recordingDuration: Number(RecordingDuration) || existingRecording.recordingDuration,
                recordingChannels: RecordingChannels || existingRecording.recordingChannels,
                recordingSource: RecordingSource || existingRecording.recordingSource,
            });
            return { recording: updated, created: false };
        } catch (error) {
            console.error(error);
            return false;
        }
    }

    const call = await TwilioCall.findOne({ where: { callSid: CallSid } });
    if (!call) {
        console.error(`Call with SID ${CallSid} not found`);
        return false;
    }

    try {
        const created = await TwilioRecording.create({
            callId: call.id,
            recordingSid: RecordingSid,
            callSid: CallSid,
            accountSid: AccountSid,
            recordingUrl: RecordingUrl,
            recordingStatus: RecordingStatus,
            recordingStartTime: RecordingStartTime,
            recordingDuration: Number(RecordingDuration),
            recordingChannels: RecordingChannels,
            recordingSource: RecordingSource,
        });
        return { recording: created, created: true };
    } catch (error) {
        console.error(error);
        return false;
    }
}

async function getAudioFileFromUrl(url, mimeType) {
    const extension = url.split('.').pop().split('?')[0];
    const filename = generateAlphanumericId(10) + '.' + extension;
    const tempDir = '../media/temp_recordings';
    const filePath = tempDir + '/' + filename;

    try {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 20000,
        });

        const buffer = Buffer.from(res.data);

        fs.writeFileSync(filePath, buffer);
        const stream = fs.createReadStream(filePath);

        const file = {
            originalname: filename,
            buffer: buffer,
            mimetype: mimeType,
        };

        console.info(JSON.stringify({
            level: "info",
            type: "audio_fetched",
            url,
            filename,
            mimetype: mimeType,
            ts: new Date().toISOString(),
        }));

        return { file, stream };
    } catch (error) {
        console.error(JSON.stringify({
            level: "error",
            type: "audio_fetch_failed",
            url,
            message: error?.message,
            status: error?.response?.status,
            response: error?.response?.data,
            ts: new Date().toISOString(),
        }));
    }

    return null;
}

module.exports = {
    upsertCallAndTicket,
    insertTranscription,
    getCompletedTranscriptions,
    updateTicketWithTranscription,
    upsertCallRecording,
    getAudioFileFromUrl,
};
