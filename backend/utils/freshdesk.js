const fs = require('fs');
const FormData = require('form-data');

async function uploadAttachmentToFreshdesk(ticketId, filePath, fileName) {
    const authString = Buffer.from(
        `${process.env.FRESHDESK_API_KEY}:X`
    ).toString("base64");

    const form = new FormData();
    form.append("attachments[]", fs.createReadStream(filePath), fileName);

    const response = await fetch(
        `${process.env.FRESHDESK_URL}/api/v2/tickets/${ticketId}/attachments`,
        {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                ...form.getHeaders(),
            },
            body: form
        }
    );

    if (!response.ok) {
        const text = await response.text();
        console.error("❌ Freshservice attachment error:", text);
        throw new Error(text);
    }

    console.info("📎 Attachment uploaded to Freshservice:", fileName);
    return true;
}

module.exports = { uploadAttachmentToFreshdesk };
