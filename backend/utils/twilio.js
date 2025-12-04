onst {
    Client, Ticket, TwilioTranscription, TwilioCall, TwilioRecording,
        Location, LocationPhoneNumber
} = require('@db/models');

const sq = require('../db/models').sequelize;
const generateAlphanumericId = require('./randomGenerator');
const twilioConfig = require('../config/twilio');
const { Op } = require('sequelize');
const { getTitleAndDescription } = require('./openai');

const axios = require('axios');
const { Buffer } = require('buffer');
const fs = require('fs');


// ---------------------------------------------------------
// 1️⃣ CREATE TwilioCall FIRST (Solution 3: correct order)
// ---------------------------------------------------------
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
        Caller
    } = req.body;

    const clientPhone = From || Caller;

    // CHECK IF CALL ALREADY EXISTS
    let callEntry = await TwilioCall.findOne({ where: { callSid: CallSid } });

    if (!callEntry) {
        callEntry = await TwilioCall.create({
            callSid: CallSid,
            called: Called,
            from: From,
            to: To,
            callStatus: CallStatus,
            callDuration: CallDuration || 0,
            accountSid: AccountSid,
            applicationSid: ApplicationSid,
            caller: Caller,
            ticketId: null
        });
    }

    // Update minimal info
    await callEntry.update({
        callStatus: CallStatus || callEntry.callStatus,
        callDuration: CallDuration || callEntry.callDuration
    });

    // --------------------------------------------
    // FIND CLIENT
    // --------------------------------------------
    let clientByPhone = await Client.findOne({ where: { phone: clientPhone } });

    if (!clientByPhone) {
        const locationPhone = await LocationPhoneNumber.findOne({
            where: { phoneNumber: clientPhone },
            include: { model: Location, attributes: ['id', 'clientId'] }
        });

        if (locationPhone && locationPhone.Location) {
            clientByPhone = await Client.findByPk(locationPhone.Location.clientId);
        }
    }

    if (!clientByPhone) {
        clientByPhone = await Client.findByPk(twilioConfig.anonymousClientId);
        if (!clientByPhone) throw new Error("Anonymous client missing");
    }

    // Link phone to location if needed
    if (clientByPhone.id !== twilioConfig.anonymousClientId) {
        const clientLocations = await Location.findAll({ where: { clientId: clientByPhone.id } });

        if (clientLocations.length > 0) {
            const exists = await LocationPhoneNumber.findOne({
                where: { phoneNumber: clientPhone }
            });

            if (!exists) {
                await LocationPhoneNumber.create({
                    phoneType: 'Office',
                    locationId: clientLocations[0].id,
                    phoneNumber: clientPhone
                });
            }
        }
    }

    // --------------------------------------------
    // NOW CREATE THE TICKET (transaction-safe)
    // --------------------------------------------
    await sq.transaction(async (t) => {

        const ticket = await Ticket.create({
            title: '',
            description: '',
            checkIn: null,
            checkOut: null,
            clientId: clientByPhone.id,
            statusId: 1,
            hashedId: generateAlphanumericId(10),
            createdBy: twilioConfig.autoUserId
        }, { transaction: t });

        // UPDATE TwilioCall WITH ticketId
        await callEntry.update({ ticketId: ticket.id }, { transaction: t });

        // SEND TO FRESHSERVICE
        const freshdeskAuth = Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString("base64");

        const fdResponse = await fetch(`${process.env.FRESHDESK_URL}/api/v2/tickets`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${freshdeskAuth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                subject: `New Call Ticket - ${ticket.hashedId}`,
                description: `Ticket created for call from ${clientPhone}. Ticket ID: ${ticket.id}`,
                email: clientByPhone.email || '',
                phone: clientByPhone.phone || '',
                priority: 1,
                status: 2
            })
        });

        const fdData = await fdResponse.json();
        await ticket.update({ freshdeskId: fdData.id }, { transaction: t });
    });

    return {
        success: true,
        created: true,
        anonymous: clientByPhone.id === twilioConfig.anonymousClientId
    };
}


// ---------------------------------------------------------
// TRANSCRIPTION INSERT
// ---------------------------------------------------------
async function insertTranscription(req) {
    const {
        TranscriptionSid, TranscriptionEvent, CallSid, Timestamp,
        AccountSid, SequenceId, Final, TranscriptionData, Track
    } = req.body;

    const call = await TwilioCall.findOne({ where: { callSid: CallSid } });
    if (!call) return false;

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
        final: Final === 'true'
    });

    return true;
}


// ---------------------------------------------------------
// GET FINAL TRANSCRIPTION
// ---------------------------------------------------------
async function getCompletedTranscriptions(callSid) {
    const transcriptions = await TwilioTranscription.findAll({
        where: {
            callSid: callSid,
            transcriptionData: { [Op.ne]: '' }
        },
        order: [['sequenceId', 'ASC']]
    });

    if (transcriptions.length === 0) return null;

    return transcriptions
        .map(t => `${t.track}:${t.transcriptionData}`)
        .join("\n")
        .trim();
}


// ---------------------------------------------------------
// UPDATE TICKET + FRESHSERVICE WITH TRANSCRIPT
// ---------------------------------------------------------
async function updateTicketWithTranscription(callSid, transcription) {

    const call = await TwilioCall.findOne({ where: { callSid } });
    if (!call) return false;

    const ticket = await Ticket.findByPk(call.ticketId);
    if (!ticket) return false;

    const anonymous = ticket.clientId === twilioConfig.anonymousClientId;
    const { title, description } = await getTitleAndDescription(transcription, anonymous);

    await ticket.update({
        title: title.slice(0, 50),
        description: description
    });

    if (ticket.freshdeskId) {
        const freshdeskAuth = Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString("base64");

        const body = {
            description: `
<b>Call Transcript:</b><br>
<pre>${transcription}</pre>

<b>Audio Recording:</b>
<a href="${ticket.recordingUrl || ''}">Download Audio</a>

<br><br>
${description}
`
        };

        await fetch(`${process.env.FRESHDESK_URL}/api/v2/tickets/${ticket.freshdeskId}`, {
            method: "PUT",
            headers: {
                "Authorization": `Basic ${freshdeskAuth}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });
    }

    return true;
}


// ---------------------------------------------------------
// RECORDING UPSERT (works now)
// ---------------------------------------------------------
async function upsertCallRecording(req) {
    const {
        AccountSid, CallSid, RecordingSid, RecordingUrl,
        RecordingStatus, RecordingDuration, RecordingStartTime,
        RecordingChannels, RecordingSource
    } = req.body;

    let existingRecording = await TwilioRecording.findOne({ where: { recordingSid: RecordingSid } });

    if (existingRecording) {
        return {
            recording: await existingRecording.update({
                recordingUrl: RecordingUrl,
                recordingStatus: RecordingStatus,
                recordingStartTime: RecordingStartTime,
                recordingDuration: Number(RecordingDuration),
                recordingChannels: RecordingChannels,
                recordingSource: RecordingSource
            }),
            created: false
        };
    }

    const call = await TwilioCall.findOne({ where: { callSid: CallSid } });
    if (!call) throw new Error("Call entry missing — should not happen now");

    const recording = await TwilioRecording.create({
        callId: call.id,
        recordingSid: RecordingSid,
        callSid: CallSid,
        accountSid: AccountSid,
        recordingUrl: RecordingUrl,
        recordingStatus: RecordingStatus,
        recordingStartTime: RecordingStartTime,
        recordingDuration: Number(RecordingDuration),
        recordingChannels: RecordingChannels,
        recordingSource: RecordingSource
    });

    return { recording, created: true };
}


// ---------------------------------------------------------
// DOWNLOAD AUDIO FILE (for S3 + Freshservice attachment)
// ---------------------------------------------------------
async function getAudioFileFromUrl(url, mimeType) {
    const extension = url.split('.').pop().split('?')[0];
    const filename = generateAlphanumericId(10) + '.' + extension;
    const tempDir = './media/temp_recordings';
    const filePath = `${tempDir}/${filename}`;

    try {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const res = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(res.data);

        fs.writeFileSync(filePath, buffer);
        const stream = fs.createReadStream(filePath);

        return {
            file: { originalname: filename, buffer, mimetype: mimeType },
            stream,
            filePath
        };
    } catch (err) {
        console.error("Error fetching audio:", err);
        return null;
    }
}

module.exports = {
    upsertCallAndTicket,
    insertTranscription,
    getCompletedTranscriptions,
    updateTicketWithTranscription,
    upsertCallRecording,
    getAudioFileFromUrl
};