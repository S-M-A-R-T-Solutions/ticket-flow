const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const config = require('@config/twilio');
const env = require('../../../config').environment;
const urlencodedParser = express.urlencoded({ extended: true });
const { upsertCallAndTicket, insertTranscription, updateTicketWithTranscription } = require('../../../utils/twilio');

const publicWebhookPaths = [
    '/api/integrations/twilio/callStart',
    '/api/integrations/twilio/callStatus',
    '/api/integrations/twilio/transcription',
];

router.post('/callStart', urlencodedParser, async (req, res) => {
    // const result = await upsertCallAndTicket(req);
    await upsertCallAndTicket(req);

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

    // const result = await upsertCallAndTicket(req);
    await upsertCallAndTicket(req);

    return res.sendStatus(200);
});

// TODO: remove this if openai handler is working fine
router.post('/transcription', urlencodedParser, async (req, res) => {
    console.info(JSON.stringify(req.body));

    const {
        // TranscriptionSid,
        TranscriptionEvent,
        CallSid,
        // Timestamp,
        // AccountSid,
        // SequenceId,
        // Track,
        // Final,
        // TranscriptionData,
    } = req.body;

    // if (TranscriptionEvent === 'transcription-content' && TranscriptionData) {}
    // else if (TranscriptionEvent === 'transcription-stopped') {// }

    // const result = await insertTranscription(req);
    await insertTranscription(req);

    if (TranscriptionEvent === 'transcription-stopped') {
        await updateTicketWithTranscription(CallSid);
    }

    return res.sendStatus(200);
});

module.exports = { router, publicWebhookPaths };