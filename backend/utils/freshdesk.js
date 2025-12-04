const fs = require("fs");
const FormData = require("form-data");

async function uploadAttachmentToFreshservice(ticketId, filePath) {
    const authString = Buffer.from(`${process.env.FRESHDESK_API_KEY}:X`).toString("base64");

    const form = new FormData();

    // Freshservice requires a dummy field besides attachments
    form.append("description", "Attachment uploaded automatically");

    // Correct field name: "attachments"
    form.append("attachments", fs.createReadStream(filePath));

    const url = `${process.env.FRESHDESK_URL}/api/v2/tickets/${ticketId}/update_ticket`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `Basic ${authString}`,
            ...form.getHeaders()
        },
        body: form
    });

    const txt = await response.text();
    console.log("Freshservice Attachment Upload Response:", response.status, txt);

    if (!response.ok) {
        throw new Error(`Failed to upload attachment to Freshservice: ${txt}`);
    }

    return true;
}

module.exports = { uploadAttachmentToFreshservice };
