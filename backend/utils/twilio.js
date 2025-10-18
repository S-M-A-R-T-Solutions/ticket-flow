const { Client, Ticket, TwilioTranscription, TwilioCall } = require('@db/models');
const sq = require('../db/models').sequelize;
const generateAlphanumericId = require('./randomGenerator');
const twilioConfig = require('../config/twilio');
const { Op } = require('sequelize');
const { getTitleAndDescription } = require('./openai');

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
        await sq.transaction(async (t) => {
            const ticket = await Ticket.create({
                title: "",
                description: "",
                checkIn: null,
                checkOut: null,
                clientId: clientByPhone.id,
                statusId: 1,
                hashedId: generateAlphanumericId(10),
                createdBy: twilioConfig.autoUserId,
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

    const transcription = await getCompletedTranscriptions(callSid);

    const { title, description } = await getTitleAndDescription(transcription);

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

module.exports = {
    upsertCallAndTicket,
    insertTranscription,
    updateTicketWithTranscription
};