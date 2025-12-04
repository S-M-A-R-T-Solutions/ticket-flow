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
    getAudioFileFromUrl
} = require('../../../utils/twilio');

const { uploadAttachmentToFreshdesk } = require('../../../utils/freshdesk');
const { getTranscriptionFromRecording } = require('../../../utils/openai');
const { TwilioCall, Ticket } = require('../../../db/models');
const { singleFileUpload } = require('../../../awsS3');


router.post('/callStart', urlencodedParser, async (req, res) => {
    await upsertCallAndTicket(req);

    const twiml = new twilio.twiml.VoiceResponse();
    const pbx = config.pbxNumber;

    const protocol = env === 'production' ? 'https' : 'http';
    const urlRecordings = `${protocol}://${req.get('host')}/api/integrations/twilio/recordingStatus`;

    twiml.dial({
        record: 'record-from-answer',
        recordingStatusCallback: urlRecordings,
        recordingStatusCallbackMethod: 'POST',
    }, pbx);

    res.type('text/xml');
    return res.send(twiml.toString());
});


router.post('/callStatus', urlencodedParser, async (req, res) => {
    await upsertCallAndTicket(req);
    return res.sendStatus(200);
});


router.post('/recordingStatus', urlencodedParser, async (req, res) => {
    const { CallSid, RecordingStatus, RecordingUrl } = req.body;

    const result = await upsertCallRecording(req);
    if (!result) return res.sendStatus(500);

    if (RecordingStatus === 'completed') {

        const fileResult = await getAudioFileFromUrl(
            RecordingUrl.replace(/\.[^/.]+$/, '') + '.mp3',
            'audio/mpeg'
        );

        const { file, stream, filePath } = fileResult;

        // Upload to S3
        const s3url = await singleFileUpload({ file, public: true });

        // Get local call + ticket
        const call = await TwilioCall.findOne({ where: { callSid: CallSid } });
        const ticket = await Ticket.findByPk(call.ticketId);

        await ticket.update({ recordingUrl: s3url });

        // Upload MP3 to Freshservice
        if (ticket.freshdeskId) {
            await uploadAttachmentToFreshdesk(ticket.freshdeskId, filePath, file.originalname);
        }

        // TRANSCRIPT
        const transcription = await getTranscriptionFromRecording(stream);

        const { recording } = result;
        await recording.update({ s3url, transcription });

        // UPDATE TICKET + FRESHSERVICE
        await updateTicketWithTranscription(CallSid, transcription);
    }

    return res.sendStatus(200);
});


router.post('/transcription', urlencodedParser, async (req, res) => {
    const { TranscriptionEvent, CallSid } = req.body;

    await insertTranscription(req);

    if (TranscriptionEvent === 'transcription-stopped') {
        const transcription = await getCompletedTranscriptions(CallSid);
        await updateTicketWithTranscription(CallSid, transcription);
    }

    return res.sendStatus(200);
});


module.exports = {
    router,
    publicWebhookPaths: [
        '/api/integrations/twilio/callStart',
        '/api/integrations/twilio/callStatus',
        '/api/integrations/twilio/recordingStatus',
        '/api/integrations/twilio/transcription',
    ]
};
