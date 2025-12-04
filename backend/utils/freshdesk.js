const fs = require('fs');
const FormData = require('form-data');

async function uploadAttachmentToFreshservice(ticketId, filePath, fileName) {
    const apiKey = process.env.FRESHDESK_API_KEY;
    const baseUrl = process.env.FRESHDESK_URL;

    const authString = Buffer.from(`${apiKey}:X`).toString('base64');

    const form = new FormData();

    // 📎 Mandatory: Freshservice only accepts attachments[] key
    form.append('attachments[]', fs.createReadStream(filePath), fileName);

    // Puedes agregar campos adicionales si quieres
    // form.append('priority', '1');

    const response = await fetch(`${baseUrl}/api/v2/tickets/${ticketId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Basic ${authString}`,
            ...form.getHeaders()
        },
        body: form
    });

    if (!response.ok) {
        const text = await response.text();
        console.error("❌ Freshservice attachment upload failed:", text);
        throw new Error(text);
    }

    console.log(`📎 Attachment uploaded to Freshservice ticket ${ticketId}`);
    return true;
}

module.exports = { uploadAttachmentToFreshservice };
