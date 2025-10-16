const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const config = require('@config/twilio');
const { Ticket, Client, TwilioCall, TwilioTranscription } = require('@db/models');
const generateAlphanumericId = require('@utils/randomGenerator');
const env = require('../../../config').environment;

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

router.post('/transcription', urlencodedParser, async (req, res) => {
    console.info(JSON.stringify(req.body));

    // if (TranscriptionEvent === 'transcription-content' && TranscriptionData) {}
    // else if (TranscriptionEvent === 'transcription-stopped') {// }

    const result = await insertTranscription(req);

    return res.sendStatus(200);
});

module.exports = { router, publicWebhookPaths };