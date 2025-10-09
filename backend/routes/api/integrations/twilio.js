const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const config = require('@/config/twilio');
const { Ticket, Client, TwilioCall } = require('@/db/models');
const generateAlphanumericId = require('@utils/randomGenerator');

const urlencodedParser = express.urlencoded({ extended: true });

router.post('/callStart', urlencodedParser, (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
    const pbx = config.pbxNumber;
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

    // FIXME: phoneNumber should be string to accommodate for international numbers
    const clientByPhone = await Client.findOne({ where: { phoneNumber: clientPhone } });

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

module.exports = router;