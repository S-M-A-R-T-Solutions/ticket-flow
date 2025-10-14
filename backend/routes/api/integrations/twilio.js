const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const config = require('@config/twilio');
const { Ticket, Client, TwilioCall } = require('@db/models');
const generateAlphanumericId = require('@utils/randomGenerator');
const env = require('../../../config').environment;

const sequelize = require('../../../db/models').sequelize;

const urlencodedParser = express.urlencoded({ extended: true });

const publicWebhookPaths = [
    '/api/integrations/twilio/callStart',
    '/api/integrations/twilio/callStatus',
    '/api/integrations/twilio/transcription',
];

router.post('/callStart', urlencodedParser, (req, res) => {
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

    if (CallStatus !== 'completed') return res.sendStatus(200);

    const clientPhone = From === "" ? Caller : From;

    const clientByPhone = await Client.findOne({ where: { phone: clientPhone } });

    if (!clientByPhone) return res.sendStatus(200);

    // TODO: research about twilio call transcriptions and recordings

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
                callDuration: CallDuration,
                accountSid: AccountSid,
                applicationSid: ApplicationSid,
                caller: Caller,
            }, { transaction: t });
        });
    } catch (err) {
        console.error(err);
    }

    return res.sendStatus(200);
});

const getTwilioTranscription = async (transcriptionSid) => {
    const transcription = await config.client.transcriptions(transcriptionSid)
        .fetch();
    return transcription;
};

router.post('/transcription', urlencodedParser, async (req, res) => {
    const { TranscriptionSid, TranscriptionEvent, CallSid, AccountSid } = req.body;

    console.info(JSON.stringify(req.body));

    if (TransitionEvent === 'transcription-stopped') {
        const transcription = await getTwilioTranscription(TranscriptionSid);
        console.info(JSON.stringify(transcription));
    }

    res.sendStatus(200);
});

module.exports = { router, publicWebhookPaths };