const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const config = require('@config/twilio');
const env = require('../../../config').environment;
const urlencodedParser = express.urlencoded({ extended: true });
const {
    upsertCallAndTicket,
    insertTranscription,
    updateTicketWithTranscription,
    upsertCallRecording,
    getCompletedTranscriptions,
    getAudioFileFromUrl,
} = require('../../../utils/twilio');


const { getTranscriptionFromRecording } = require('../../../utils/openai');

const { TwilioCall } = require('../../../db/models');
const { Ticket } = require('../../../db/models');

const { singleFileUpload } = require('../../../awsS3');

const publicWebhookPaths = [
    '/api/integrations/twilio/callStart',
    '/api/integrations/twilio/callStatus',
    '/api/integrations/twilio/recordingStatus',
    '/api/integrations/twilio/transcription',
];

router.post('/callStart', urlencodedParser, async (req, res) => {
    // const result = await upsertCallAndTicket(req);
    await upsertCallAndTicket(req);

    const twiml = new twilio.twiml.VoiceResponse();
    const pbx = config.pbxNumber;
    const protocol = env === 'production' ? 'https' : 'http';
    // const urlTranscriptions = protocol + '://' + req.get('host') + '/api/integrations/twilio/transcription';
    const urlRecordings = protocol + '://' + req.get('host') + '/api/integrations/twilio/recordingStatus';

    // twiml.start().transcription({
    //     statusCallbackUrl: urlTranscriptions,
    // });

    twiml.dial({
        record: 'record-from-answer',
        recordingStatusCallback: urlRecordings,
        recordingStatusCallbackMethod: 'POST',
    }, pbx);

    twiml.say(config.answerMessage);

    twiml.record({
        recordingStatusCallback: urlRecordings,
        recordingStatusCallbackMethod: 'POST'
    });

    res.type('text/xml');
    return res.send(twiml.toString());
});

router.post('/callStatus', urlencodedParser, async (req, res) => {
    // if (CallStatus !== 'completed') return res.sendStatus(200);

    // const result = await upsertCallAndTicket(req);
    await upsertCallAndTicket(req);

    return res.sendStatus(200);
});

router.post('/recordingStatus', urlencodedParser, async (req, res) => {
    console.info(JSON.stringify(req.body));

    const result = await upsertCallRecording(req);
    if (!result) {
        console.error('Failed to upsert call recording');
        return res.sendStatus(500);
    }

    const { CallSid, RecordingStatus, RecordingUrl } = req.body;

    if (RecordingStatus === 'completed') {
        try {
            const { file, stream } = await getAudioFileFromUrl(RecordingUrl.replace(/\.[^/.]+$/, '') + '.mp3', 'audio/mpeg');
            const s3url = await singleFileUpload({ file, public: true });
            console.info('Recording uploaded to S3 URL: ' + s3url);

            const call = await TwilioCall.findOne({ where: { callSid: CallSid } });
            const ticket = await Ticket.findByPk(call.ticketId);

            // Guardamos la URL pública del audio
            await ticket.update({ recordingUrl: s3url });

            // Subir el MP3 como attachment al Freshservice ticket
            if (ticket.freshdeskId) {
                const audioTempPath = `../media/temp_recordings/${file.originalname}`;
                const audioName = file.originalname;

                const { uploadAttachmentToFreshservice } = require('../../../utils/freshdesk');

                try {
                    await uploadAttachmentToFreshservice(ticket.freshdeskId, audioTempPath, audioName);
                    console.info(`📎 MP3 attached to Freshservice ticket ${ticket.freshdeskId}`);
                } catch (error) {
                    console.error("❌ Error uploading attachment:", error);
                }
            }

            const { recording } = result;
            const transcription = await getTranscriptionFromRecording(stream);

            await recording.update({ s3url });

            await ticket.update({ recordingUrl: s3url });


            await recording.update({ transcription });

            await updateTicketWithTranscription(CallSid, transcription);
        } catch (error) {
            console.error(error);
            return res.sendStatus(500);
        }
    }

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
        const transcription = await getCompletedTranscriptions(CallSid);
        await updateTicketWithTranscription(CallSid, transcription);
    }

    return res.sendStatus(200);
});

module.exports = { router, publicWebhookPaths };