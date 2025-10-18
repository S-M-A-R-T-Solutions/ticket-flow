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

module.exports = { getTitleAndDescription };