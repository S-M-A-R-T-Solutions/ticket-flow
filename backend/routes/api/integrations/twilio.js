const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const config = require('../../../config');

const urlencodedParser = express.urlencoded({ extended: true });

router.post('/callStart', urlencodedParser, (req, res) => {
    // const { From, To, CallSid } = req.body;
    console.log(`callStart: ${JSON.stringify(req.body)}`);

    const twiml = new twilio.twiml.VoiceResponse();
    const pbx = config.twilioConfig.pbxNumber;
    twiml.dial(pbx);

    res.type('text/xml');
    return res.send(twiml.toString());
});

router.post('/callStatus', urlencodedParser, (req, res) => {
    // const { From, To, CallSid, CallStatus } = req.body;
    console.log(`callStatus: ${JSON.stringify(req.body)}`);
    return res.sendStatus(200);
});

module.exports = router;