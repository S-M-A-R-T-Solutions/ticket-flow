const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function uploadAttachmentToFreshservice(ticketId, absoluteFilePath, fileName) {

    if (!fs.existsSync(absoluteFilePath)) {
        console.error("❌ File not found:", absoluteFilePath);
        throw new Error("Attachment file does not exist");
    }

    const apiKey = process.env.FRESHDESK_API_KEY;
    const baseUrl = process.env.FRESHDESK_URL;

    const authString = Buffer.from(`${apiKey}:X`).toString('base64');

    const form = new FormData();
    form.append("attachments[]", fs.createReadStream(absoluteFilePath), fileName);

    const response = await fetch(`${baseUrl}/api/v2/tickets/${ticketId}/attachments`, {
        method: "POST",
        headers: {
            "Authorization": `Basic ${authString}`,
            ...form.getHeaders()
        },
        body: form
    });

    const text = await response.text();
    console.log("📨 Freshservice Attachment Response:", response.status, text);

    if (!response.ok) {
        throw new Error(`Freshservice attachment upload failed: ${text}`);
    }

    console.log("📎 Attachment uploaded successfully");
    return true;
}

module.exports = { uploadAttachmentToFreshservice };
