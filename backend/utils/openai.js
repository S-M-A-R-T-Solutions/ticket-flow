const openaiApiKey = require('../config').openaiApiKey;
const { OpenAI } = require('openai');

async function getTitleAndDescription(transcription) {
    if (transcription === null || transcription.length === 0) {
        return { title: 'Missed Call', description: 'No transcription available for this call due to missing or incomplete data. Please, contact as soon as possible.' };
    }

    const client = new OpenAI({ apiKey: openaiApiKey });

    try {
        const response = await client.responses.create({
            model: "gpt-5",
            input: [
                {
                    role: "user",
                    content: "Generate a concise title (max 10 words) and a detailed description (max 100 words) for a support ticket based on the following conversation transcription. Format the response json as '{title, description}'. Give only the json response without any additional text. This transcription may include multiple languages, primarily English and Spanish.\n\nTranscription:\n" + transcription,
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
            prompt: "Get the transcription text from the following audio recording URL. Provide only the transcription text without any additional text. The audio recording is from a customer support call. The call can be in multiple languages at the same time, mostly English and Spanish. If possible label the customer and agent parts.",
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