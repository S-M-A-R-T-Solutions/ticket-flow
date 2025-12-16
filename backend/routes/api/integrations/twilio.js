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

/* -----------------------------
Helpers: fire-and-forget + logs
-------------------------------- */
function fireAndForget(fn, label = 'background-task', ctx = {}) {
    Promise.resolve()
        .then(fn)
        .catch((err) => {
            console.error(JSON.stringify({
                level: "error",
                type: "background_fail",
                label,
                ...ctx,
                status: err?.response?.status,
                code: err?.code,
                message: err?.message,
                response: err?.response?.data,
                ts: new Date().toISOString(),
            }));
        });
}

function logExtOk(service, step, ctx = {}, extra = {}) {
    console.info(JSON.stringify({
        level: "info",
        type: "external_ok",
        service,
        step,
        ...ctx,
        ...extra,
        ts: new Date().toISOString(),
    }));
}

function logExtFail(service, step, err, ctx = {}) {
    console.error(JSON.stringify({
        level: "error",
        type: "external_fail",
        service,
        step,
        ...ctx,
        status: err?.response?.status,
        code: err?.code,
        message: err?.message,
        response: err?.response?.data,
        ts: new Date().toISOString(),
    }));
}

async function bestEffort(service, step, ctx, fn) {
    try {
        const result = await fn();
        logExtOk(service, step, ctx);
        return { ok: true, result };
    } catch (err) {
        logExtFail(service, step, err, ctx);
        return { ok: false, error: err };
    }
}

/* -----------------------------
Routes
-------------------------------- */

router.post('/callStart', urlencodedParser, (req, res) => {
    // 1) Respondemos TwiML SIEMPRE y rápido (la llamada no depende de nada externo)
    const twiml = new twilio.twiml.VoiceResponse();
    const pbx = config.pbxNumber;
    const protocol = env === 'production' ? 'https' : 'http';
    const urlRecordings = `${protocol}://${req.get('host')}/api/integrations/twilio/recordingStatus`;

    // Mensaje opcional antes de conectar (si lo quieres)
    if (config?.answerMessage) twiml.say(config.answerMessage);

    twiml.dial({
        record: 'record-from-answer',
        recordingStatusCallback: urlRecordings,
        recordingStatusCallbackMethod: 'POST',
    }, pbx);

    res.type('text/xml');
    res.send(twiml.toString());

    // 2) Side-effects en background (nunca bloquean la llamada)
    const ctx = { CallSid: req?.body?.CallSid };
    fireAndForget(() => upsertCallAndTicket(req), 'upsertCallAndTicket(callStart)', ctx);
});

router.post('/callStatus', urlencodedParser, (req, res) => {
    // Respondemos 200 ya
    res.sendStatus(200);

    // Background best-effort
    const ctx = { CallSid: req?.body?.CallSid };
    fireAndForget(() => upsertCallAndTicket(req), 'upsertCallAndTicket(callStatus)', ctx);
});

router.post('/recordingStatus', urlencodedParser, (req, res) => {
    // Respondemos 200 ya (Twilio no espera a nada)
    res.sendStatus(200);

    fireAndForget(async () => {
        console.info(JSON.stringify({
            level: "info",
            type: "webhook",
            name: "recordingStatus",
            body: req.body,
            ts: new Date().toISOString(),
        }));

        // 1) Upsert recording local (best-effort pero local)
        const result = await upsertCallRecording(req);
        if (!result) return;

        const { CallSid, RecordingStatus, RecordingUrl } = req.body;
        if (RecordingStatus !== 'completed') return;

        const baseCtx = { CallSid };

        // 2) Descargar MP3 (externo → log)
        const audioRes = await bestEffort('twilio', 'download_mp3', baseCtx, async () => {
            const mp3Url = RecordingUrl.replace(/\.[^/.]+$/, '') + '.mp3';
            const out = await getAudioFileFromUrl(mp3Url, 'audio/mpeg');
            if (!out) throw new Error('getAudioFileFromUrl returned null');
            return out;
        });
        if (!audioRes.ok) return;

        const { file, stream } = audioRes.result;

        // 3) Subir a S3 (externo → log)
        const s3Res = await bestEffort('s3', 'upload_mp3', baseCtx, async () => {
            return singleFileUpload({ file, public: true });
        });

        // 4) Buscar call/ticket local
        const call = await TwilioCall.findOne({ where: { callSid: CallSid } });
        if (!call) return;

        const ticket = await Ticket.findByPk(call.ticketId);
        const ctx = {
            ...baseCtx,
            ticketId: ticket?.id,
            freshdeskId: ticket?.freshdeskId,
        };

        // Guardar URL en DB solo si existe
        if (ticket && s3Res.ok && s3Res.result) {
            await ticket.update({ recordingUrl: s3Res.result });
        }

        // Guardar en recording local (best-effort)
        await bestEffort('db', 'update_recording_s3url', ctx, async () => {
            await result.recording.update({ s3url: s3Res.ok ? s3Res.result : null });
            return true;
        });

        // 5) Adjuntar MP3 a Freshservice (externo → log, NO bloquea)
        if (ticket?.freshdeskId && s3Res.ok) {
            await bestEffort('freshservice', 'attach_mp3', ctx, async () => {
                const { uploadAttachmentToFreshservice } = require('../../../utils/freshdesk');
                const audioTempPath = `../media/temp_recordings/${file.originalname}`;
                return uploadAttachmentToFreshservice(ticket.freshdeskId, audioTempPath, file.originalname);
            });
        }

        // 6) Transcribir con OpenAI (externo → log, NO bloquea)
        const aiRes = await bestEffort('openai', 'transcribe_audio', ctx, async () => {
            return getTranscriptionFromRecording(stream);
        });

        if (aiRes.ok && aiRes.result) {
            // Guardar transcription local (best-effort)
            await bestEffort('db', 'update_recording_transcription', ctx, async () => {
                await result.recording.update({ transcription: aiRes.result });
                return true;
            });

            // 7) Actualizar ticket con transcription (incluye OpenAI title/desc + Freshservice update)
            await bestEffort('app', 'updateTicketWithTranscription', ctx, async () => {
                return updateTicketWithTranscription(CallSid, aiRes.result);
            });
        }
    }, 'recordingStatus-processing', { CallSid: req?.body?.CallSid });
});

// (Si estás usando el handler Twilio transcription directo)
router.post('/transcription', urlencodedParser, (req, res) => {
    res.sendStatus(200);

    const { TranscriptionEvent, CallSid } = req.body;
    const ctx = { CallSid };

    fireAndForget(async () => {
        console.info(JSON.stringify({
            level: "info",
            type: "webhook",
            name: "transcription",
            body: req.body,
            ts: new Date().toISOString(),
        }));

        await insertTranscription(req);

        if (TranscriptionEvent === 'transcription-stopped') {
            const transcription = await getCompletedTranscriptions(CallSid);
            await updateTicketWithTranscription(CallSid, transcription);
        }
    }, 'twilio-transcription-processing', ctx);
});

module.exports = { router, publicWebhookPaths };
