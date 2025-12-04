const fs = require('fs');
const FormData = require('form-data');

async function uploadAttachmentToFreshservice(ticketId, filePath, fileName) {
    const authString = Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString("base64");

    const form = new FormData();

    // Freshservice requires: at least ONE non-file field
    form.append("priority", "1");

    // Attach the file WITH a filename
    form.append("attachments[]", fs.createReadStream(filePath), fileName);

    const response = await fetch(
        `${process.env.FRESHDESK_URL}/api/v2/tickets/${ticketId}`,
        {
            method: "PUT",
            headers: {
                "Authorization": `Basic ${authString}`,
                ...form.getHeaders()
            },
            body: form
        }
    );

    const txt = await response.text();
    console.log("Freshservice Attachment Upload Response:", response.status, txt);

    if (!response.ok) {
        throw new Error(`Failed to upload attachment to Freshservice: ${txt}`);
    }

    return true;
}

module.exports = { uploadAttachmentToFreshservice };
