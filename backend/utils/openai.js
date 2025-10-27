const openaiApiKey = require('../config').openaiApiKey;
const { OpenAI } = require('openai');

async function getTitleAndDescription(transcription, anonymous = false) {
    if (transcription === null || transcription.length === 0) {
        return { title: 'Missed Call', description: 'No transcription available for this call due to missing or incomplete data. Please, contact as soon as possible.' };
    }

    const client = new OpenAI({ apiKey: openaiApiKey });

    const anonymousPrompt = anonymous ? " Prefix 'Unknown Caller' in title and add a note at the end of description that clarifies the caller is unknown. " : "";

    try {
        const response = await client.responses.create({
            model: "gpt-5",
            input: [
                {
                    role: "user",
                    content: "Task: Based on the following conversation transcription, write: 1.⁠ ⁠'title': a short, clear issue title in English only (maximum 50 characters). 2.⁠ 'description': a detailed, factual summary in English only (maximum 100 words) explaining the customer's problem, actions taken, results, and any pending tasks. Output rules: ⁠Respond ONLY with valid JSON formatted exactly as: {'title': '...','description': '...'} ⁠Use double quotes for all keys and values. ⁠Do not include explanations, markdown, or any text outside the JSON. ⁠Preserve technical names, error codes, IPs, and software terms exactly as mentioned. Ignore any Spanish or other non-English text in the transcription; translate to English where needed. ⁠Keep tone professional, concise, and suitable for CRM ticket entry." + anonymousPrompt + " This is the transcription text: " + transcription,
                },
            ],
        });

        console.info('getTitleAndDescription:\n' + response.output_text);

        const { title, description } = JSON.parse(response.output_text);
        return { title, description };
    } catch (error) {
        console.error('Error parsing OpenAI response:', error);
    }

    return { title: '', description: '' };
}

async function getTranscriptionFromRecording(file) {
    const client = new OpenAI({ apiKey: openaiApiKey });

    // const audioUrl = recordingUrl.replace(/\.[^/.]+$/, '') + '.mp3';
    // console.info('getTranscriptionFromRecording - audioUrl: ' + audioUrl);

    let transcription = null;

    try {
        const response = await client.audio.transcriptions.create({
            file: file,
            model: "gpt-4o-transcribe",
            response_format: "text",
            prompt: "Your task: Write a concise, well-structured summary of the call in English, followed by a short Spanish version if Spanish was used. Clearly describe what the customer reported, what troubleshooting or actions were taken, and the final outcome. Identify and list any pending tasks or follow-ups still required, written as short actionable bullet points (e.g., “Reset 3CX SIP trunk,” “Install Windows updates,” “Verify Open Dental backup”). Preserve all technical names, versions, IPs, or tools mentioned (e.g., 3CX, UDM, Open Dental, MySQL, Synology). Keep the tone professional, factual, and free of filler. If the transcript contains both English and Spanish, summarize bilingually while keeping each section clear and separate. Goal: Produce a clean, objective summary that a technician or client can quickly review to understand what occurred, what was resolved, and what tasks remain open.",
        });

        console.info('getTranscriptionFromRecording:\n' + JSON.stringify(response));

        transcription = response;
    }
    catch (error) {
        console.error('Error getting transcription from recording:', error);
        return null;
    }

    return transcription;
}

module.exports = { getTitleAndDescription, getTranscriptionFromRecording };