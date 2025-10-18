const openaiApiKey = require('../config').openaiApiKey;
const { OpenAI } = require('openai');

async function getTitleAndDescription(transcription) {
    if (transcription === null || transcription.length === 0) {
        return { title: 'Missed Call', description: 'No transcription available for this call due to missing or incomplete data. Please, contact as soon as possible.' };
    }

    const client = new OpenAI({ apiKey: openaiApiKey });

    const response = await client.responses.create({
        model: "gpt-5",
        input: [
            {
                role: "system",
                content: "Generate a concise title (max 10 words) and a detailed description (max 100 words) for a support ticket based on the following conversation transcription. Format the response json as '{title, description}'. Give only the json response without any additional text.",
            },
            {
                role: "user",
                content: transcription,
            },
        ],
    });

    console.info('getTitleAndDescription:\n' + response.choices[0].message.content);

    try {
        const { title, description } = JSON.parse(response.choices[0].message.content);
        return { title, description };
    } catch (error) {
        console.error('Error parsing OpenAI response:', error);
    }

    return { title: '', description: '' };
}

async function getTranscriptionFromRecording(recordingUrl) {
    const client = new OpenAI({ apiKey: openaiApiKey });

    const response = await client.responses.create({
        model: "gpt-5",
        input: [
            {
                role: "system",
                content: "Get the transcription text from the following audio recording URL. Provide only the transcription text without any additional text. The audio recording is from a customer support call. The call can be in multiple languages at the same time, mostly English and Spanish. If possible label the customer and agent parts.",
            },
            {
                role: "user",
                content: recordingUrl,
            },
        ],
    });

    const transcription = response.choices[0].message.content.trim();
    console.info('getTranscriptionFromRecording:\n' + transcription);

    return transcription;
}

module.exports = { getTitleAndDescription, getTranscriptionFromRecording };