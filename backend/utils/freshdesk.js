const fs = require('fs');
const FormData = require('form-data');

async function uploadAttachmentToFreshdesk(ticketId, filePath, fileName) {
    const authString = Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString("base64");

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
        const errText = await response.text();
        console.error("❌ Freshservice attachment upload failed:", errText);
        throw new Error("Failed to upload attachment to Freshservice");
    }

    console.info("📎 Attachment uploaded to Freshservice");
    return true;
}

module.exports = { uploadAttachmentToFreshdesk };
