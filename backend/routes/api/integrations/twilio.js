const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const config = require('../../../config');

router.post('/callStart', (req, res) => {
    const { From, To, CallSid } = req.body;
    console.log(`callStart: ${req.body}`);

    const twiml = new twilio.twiml.VoiceResponse();
    const pbx = config.twilioConfig.pbxNumber;
    twiml.dial(pbx);

    res.type('text/xml');
    return res.send(twiml.toString());
});

router.post('/callStatus', (req, res) => {
    const { From, To, CallSid, CallStatus } = req.body;
    console.log(`callStatus: ${req.body}`);
    return res.sendStatus(200);
});

module.exports = router;