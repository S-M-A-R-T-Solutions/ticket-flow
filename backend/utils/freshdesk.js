const fs = require('fs');
const FormData = require('form-data');

async function uploadAttachmentToFreshservice(ticketId, filePath, fileName) {
    const authString = Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString("base64");

    const form = new FormData();
    form.append("attachments", fs.createReadStream(filePath), fileName);

    const response = await fetch(
        `${process.env.FRESHDESK_URL}/api/v2/tickets/${ticketId}/attachments`,
        {
            method: "POST",
            headers: {
                "Authorization": `Basic ${authString}`,
                ...form.getHeaders()
            },
            body: form
        }
    );

    const text = await response.text();

    console.log("Freshservice Attachment Upload Response:", response.status, text);

    if (!response.ok) {
        throw new Error(text);
    }

    return true;
}

module.exports = { uploadAttachmentToFreshservice };
