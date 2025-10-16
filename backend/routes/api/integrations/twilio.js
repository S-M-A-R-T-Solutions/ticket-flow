const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const config = require('@config/twilio');
const { Ticket, Client, TwilioCall, TwilioTranscription } = require('@db/models');
const generateAlphanumericId = require('@utils/randomGenerator');
const env = require('../../../config').environment;
const openaiApiKey = require('../../../config').openaiApiKey;
const { OpenAI } = require('openai');
const { where, Op } = require('sequelize');

const sequelize = require('../../../db/models').sequelize;

const urlencodedParser = express.urlencoded({ extended: true });

const publicWebhookPaths = [
    '/api/integrations/twilio/callStart',
    '/api/integrations/twilio/callStatus',
    '/api/integrations/twilio/transcription',
];

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

    // If call already exists, update its status and duration
    if (existingCall) {
        try {
            await existingCall.update({
                callStatus: CallStatus || existingCall.callStatus,
                callDuration: CallDuration || existingCall.callDuration,
            });
        } catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }

    // If call does not exist, create a new ticket and call record

    const clientPhone = From === "" ? Caller : From;

    const clientByPhone = await Client.findOne({ where: { phone: clientPhone } });

    if (!clientByPhone) {
        console.error(`Client with phone ${clientPhone} not found`);
        return false;
    }

    try {
        await sequelize.transaction(async (t) => {
            const ticket = await Ticket.create({
                title: "",
                description: "",
                checkIn: null,
                checkOut: null,
                clientId: clientByPhone.id,
                statusId: 1,
                hashedId: generateAlphanumericId(10),
                createdBy: config.autoUserId,
            }, { transaction: t });

            await TwilioCall.create({
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
            }, { transaction: t });
        });
    } catch (err) {
        console.error(err);
        return false;
    }

    return true;
};

router.post('/callStart', urlencodedParser, async (req, res) => {
    const result = await upsertCallAndTicket(req);

    const twiml = new twilio.twiml.VoiceResponse();
    const pbx = config.pbxNumber;
    const protocol = env === 'production' ? 'https' : 'http';
    const url = protocol + '://' + req.get('host') + '/api/integrations/twilio/transcription';

    // twiml.record({ transcribe: true, transcribeCallback: url, playBeep: false });

    twiml.start().transcription({
        statusCallbackUrl: url,
    });

    twiml.say(config.answerMessage);
    twiml.dial(pbx);

    res.type('text/xml');
    return res.send(twiml.toString());
});

router.post('/callStatus', urlencodedParser, async (req, res) => {
    // if (CallStatus !== 'completed') return res.sendStatus(200);

    const result = await upsertCallAndTicket(req);

    return res.sendStatus(200);
});

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
            transcriptionData: { [Op.ne]: null },
            transcriptionData: { [Op.ne]: '' },
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

async function getTitleAndDescription(callSid) {
    const transcription = await getCompletedTranscriptions(callSid);

    if (transcription === null || transcription.length === 0) {
        return { title: 'Missed Call', description: 'No transcription available for this call due to missing or incomplete data. Please, contact as soon as possible.' };
    }

    const client = new OpenAI({ apiKey: openaiApiKey });

    const response = await client.responses.create({
        model: "gpt-5",
        input: [
            {
                role: "system",
                content: "Generate a concise title (max 10 words) and a detailed description (max 100 words) for a support ticket based on the following conversation transcription. Format the response json as '{title, description}'. Give only the json response without any additional text.",
            },
            {
                role: "user",
                content: transcription,
            },
        ],
    });

    console.info('getTitleAndDescription:\n' + response.choices[0].message.content);

    try {
        const { title, description } = JSON.parse(response.choices[0].message.content);
        return { title, description };
    } catch (error) {
        console.error('Error parsing OpenAI response:', error);
    }

    return { title: '', description: '' };
}

async function updateTicketWithTranscription(callSid) {
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

    const { title, description } = await getTitleAndDescription(callSid);

    try {
        await ticket.update({
            title: title || 'No Title',
            description: description || 'No Description',
        });
    } catch (error) {
        console.error(error);
        return false;
    }

    return true;
}

router.post('/transcription', urlencodedParser, async (req, res) => {
    console.info(JSON.stringify(req.body));

    const {
        TranscriptionSid,
        TranscriptionEvent,
        CallSid,
        Timestamp,
        AccountSid,
        SequenceId,
        Track,
        Final,
        TranscriptionData,
    } = req.body;

    // if (TranscriptionEvent === 'transcription-content' && TranscriptionData) {}
    // else if (TranscriptionEvent === 'transcription-stopped') {// }

    const result = await insertTranscription(req);

    if (TranscriptionEvent === 'transcription-stopped') {
        await updateTicketWithTranscription(CallSid);
    }

    return res.sendStatus(200);
});

module.exports = { router, publicWebhookPaths };