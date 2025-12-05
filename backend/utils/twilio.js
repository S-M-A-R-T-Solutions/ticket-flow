const { Client, Ticket, TwilioTranscription, TwilioCall, TwilioRecording, Location, LocationPhoneNumber } = require('@db/models');
const sq = require('../db/models').sequelize;
const generateAlphanumericId = require('./randomGenerator');
const twilioConfig = require('../config/twilio');
const { Op } = require('sequelize');
const { getTitleAndDescription } = require('./openai');

const axios = require('axios');
const { Buffer } = require('buffer');
const fs = require('fs');

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

    // 1️⃣ Buscamos si la llamada ya existe
    let callEntry = await TwilioCall.findOne({ where: { callSid: CallSid } });

    if (callEntry) {
        await callEntry.update({
            callStatus: CallStatus || callEntry.callStatus,
            callDuration: CallDuration || callEntry.callDuration,
        });
        return { success: true, created: false };
    }

    // 2️⃣ Buscar cliente
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

    if (!clientByPhone)
        clientByPhone = await Client.findByPk(twilioConfig.anonymousClientId);

    if (!clientByPhone) throw new Error("Anonymous client missing in DB");

    // 3️⃣ Crear Ticket LOCAL (rápido)
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

    // 4️⃣ Crear TwilioCall INMEDIATELY con ticketId → así nunca es null
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

    // 5️⃣ Ahora sí podemos crear ticket en FRESHSERVICE
    const freshdeskAuth = Buffer.from(
        `${process.env.FRESHDESK_API_KEY}:X`
    ).toString("base64");

    const fdResponse = await fetch(`${process.env.FRESHDESK_URL}/api/v2/tickets`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${freshdeskAuth}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            subject: `New Call Ticket - ${clientPhone}`,
            description: `Ticket created for call from ${clientPhone}. Ticket ID: ${ticket.id}`,
            email: clientByPhone.email || '',
            phone: clientByPhone.phone || '',
            priority: 1,
            status: 2,
        })
    });

    const fdData = await fdResponse.json();

    console.log("📨 Freshservice Ticket Creation Response:", fdResponse.status, fdData);

    const ticketForUpdate = await Ticket.findByPk(ticket.id);

    ticketForUpdate.freshdeskId = fdData.ticket.id;
    await ticketForUpdate.save();

    console.log(`Ticket ${ticket.id} linked to Freshservice Ticket ${ticketForUpdate.freshdeskId}`);

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
        console.error(`Call with SID ${CallSid} not found`);
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
    }
    catch (error) {
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
                [Op.and]: [
                    { [Op.ne]: null },
                    { [Op.ne]: '' }
                ]
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
    });

    console.info('getCompletedTranscriptions:\n' + completed);

    return completed.trim();
}

const FormData = require("form-data");

async function updateTicketWithTranscription(callSid, transcription) {
    const call = await TwilioCall.findOne({ where: { callSid } });
    if (!call) return false;

    const ticket = await Ticket.findByPk(call.ticketId);
    if (!ticket) return false;

    const { title, description } = await getTitleAndDescription(transcription);

    await ticket.update({
        title: title.slice(0, 50),
        description
    });

    if (!ticket.freshdeskId) return true;

    const freshdeskAuth = Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`)
        .toString("base64");

    const bodyWithTranscription = `${description}`;

    const form = new FormData();
    form.append("subject", title.slice(0, 50));
    form.append("description", bodyWithTranscription);

    const response = await fetch(
        `${process.env.FRESHDESK_URL}/api/v2/tickets/${ticket.freshdeskId}`,
        {
            method: "PUT",
            headers: {
                "Authorization": `Basic ${freshdeskAuth}`,
                ...form.getHeaders()
            },
            body: {
                description: bodyWithTranscription,
                subject: title.slice(0, 50),
            }
        }
    );

    console.log("📨 Freshservice Update Response:", response.status, await response.text());

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

    let result = null;

    if (existingRecording) {
        try {
            result = await existingRecording.update({
                recordingUrl: RecordingUrl || existingRecording.recordingUrl,
                recordingStatus: RecordingStatus || existingRecording.recordingStatus,
                recordingStartTime: RecordingStartTime || existingRecording.recordingStartTime,
                recordingDuration: Number(RecordingDuration) || existingRecording.recordingDuration,
                recordingChannels: RecordingChannels || existingRecording.recordingChannels,
                recordingSource: RecordingSource || existingRecording.recordingSource,
            });
        }
        catch (error) {
            console.error(error);
            return false;
        }

        return { recording: result, created: false };
    }

    const call = await TwilioCall.findOne({ where: { callSid: CallSid } });

    if (!call) {
        console.error(`Call with SID ${CallSid} not found`);
        return false;
    }

    try {
        result = await TwilioRecording.create({
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
    }
    catch (error) {
        console.error(error);
        return false;
    }

    return { recording: result, created: true };
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

        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        fs.writeFileSync(filePath, buffer);
        const stream = fs.createReadStream(filePath);

        const file = {
            originalname: filename,
            buffer: buffer,
            mimetype: mimeType,
        };

        console.info('Fetched audio file from URL and saved to disk:\n' + JSON.stringify({
            originalname: filename,
            mimetype: mimeType,
            buffer: String(buffer).slice(0, 20) + '...'
        }));

        return { file, stream };
    } catch (error) {
        console.error('Error fetching audio file from URL:', error);
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