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

    const existingCall = await TwilioCall.findOne({ where: { callSid: CallSid } });

    if (existingCall) {
        try {
            await existingCall.update({
                callStatus: CallStatus || existingCall.callStatus,
                callDuration: CallDuration || existingCall.callDuration,
            });
            return { success: true, created: false, anonymous: null };
        } catch (error) {
            console.error(error);
            return { success: false, created: null, anonymous: null };
        }
    }

    const clientPhone = From || Caller;
    let clientByPhone = null;

    try {
        // 1️⃣ Busca directamente por teléfono de cliente
        clientByPhone = await Client.findOne({ where: { phone: clientPhone } });

        // 2️⃣ Si no está en Client, busca por LocationPhoneNumber
        if (!clientByPhone) {
            const locationPhone = await LocationPhoneNumber.findOne({
                where: { phoneNumber: clientPhone },
            });

            if (locationPhone) {
                const location = await Location.findByPk(locationPhone.locationId);
                if (location) {
                    clientByPhone = await Client.findByPk(location.clientId);
                    console.info(`✅ Found client by location phone number: ${clientPhone}`);
                }
            }
        }

        // 3️⃣ Si aún no se encuentra, asigna cliente anónimo
        if (!clientByPhone) {
            console.warn(`⚠️ Client with phone ${clientPhone} not found, using anonymous client`);
            clientByPhone = await Client.findByPk(twilioConfig.anonymousClientId);
        }

        if (!clientByPhone) throw new Error('Anonymous client not found');

        // 4️⃣ Evita duplicar LocationPhoneNumber si ya existe
        if (clientByPhone.id !== twilioConfig.anonymousClientId) {
            const clientLocations = await Location.findAll({ where: { clientId: clientByPhone.id } });

            // Verifica si el número ya está registrado en alguna location del cliente
            const numberExists = await LocationPhoneNumber.findOne({
                where: { phoneNumber: clientPhone },
            });

            if (!numberExists && clientLocations.length > 0) {
                // Si el número pertenece al cliente, lo asignamos a su primera location activa
                await LocationPhoneNumber.create({
                    phoneNumber: clientPhone,
                    locationId: clientLocations[0].id,
                });
                console.info(`📞 Linked phone ${clientPhone} to client ${clientByPhone.id}`);
            }
        }

        // 5️⃣ Crea ticket y llamada dentro de una transacción
        await sq.transaction(async (t) => {
            const ticket = await Ticket.create(
                {
                    title: "",
                    description: "",
                    checkIn: null,
                    checkOut: null,
                    clientId: clientByPhone.id,
                    statusId: 1,
                    hashedId: generateAlphanumericId(10),
                    createdBy: twilioConfig.autoUserId,
                },
                { transaction: t }
            );

            await TwilioCall.create(
                {
                    ticketId: ticket.id,
                    called: Called,
                    callSid: CallSid,
                    to: To,
                    callStatus: CallStatus,
                    from: From,
                    callDuration: CallDuration || 0,
                    accountSid: AccountSid,
                    applicationSid: ApplicationSid,
                    caller: Caller,
                },
                { transaction: t }
            );
        });

        return {
            success: true,
            created: true,
            anonymous: clientByPhone.id === twilioConfig.anonymousClientId,
        };
    } catch (error) {
        console.error(error);
        return { success: false, created: null, anonymous: null };
    }
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

async function updateTicketWithTranscription(callSid, transcription) {
    const call = await TwilioCall.findOne({ where: { callSid: callSid } });

    if (!call) {
        console.error(`Call with SID ${callSid} not found`);
        return false;
    }

    const ticket = await Ticket.findOne({ where: { id: call.ticketId } });

    if (!ticket) {
        console.error(`Ticket with ID ${call.ticketId} not found`);
        return false;
    }

    const anonymous = ticket.clientId === twilioConfig.anonymousClientId;
    const { title, description } = await getTitleAndDescription(transcription, anonymous);

    try {
        await ticket.update({
            title: title.slice(0, 50) || 'No Title',
            description: description || 'No Description',
        });
    } catch (error) {
        console.error(error);
        return false;
    }

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