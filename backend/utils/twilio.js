const axios = require("axios");
const FormData = require("form-data");
const { Buffer } = require("buffer");

const FRESHSERVICE_URL = process.env.FRESHDESK_URL;
const FRESHSERVICE_KEY = process.env.FRESHDESK_API_KEY;

const authHeader = {
    Authorization:
        "Basic " + Buffer.from(`${FRESHSERVICE_KEY}:X`).toString("base64"),
};

function normalizePhone(phone) {
    if (!phone) return null;
    return phone.replace(/[^\d+]/g, "");
}

/* ───────────────────────────────────────────── */
/* CONTACT HANDLING */
/* ───────────────────────────────────────────── */

async function findFreshserviceContact({ phone, email }) {
    const normalizedPhone = normalizePhone(phone);

    try {
        if (email) {
            const res = await axios.get(
                `${FRESHSERVICE_URL}/api/v2/contacts?email=${encodeURIComponent(email)}`,
                { headers: authHeader }
            );
            if (res.data?.results?.length) return res.data.results[0];
        }

        if (normalizedPhone) {
            const res = await axios.get(
                `${FRESHSERVICE_URL}/api/v2/contacts?work_phone=${encodeURIComponent(normalizedPhone)}`,
                { headers: authHeader }
            );
            if (res.data?.results?.length) return res.data.results[0];
        }
    } catch (err) {
        console.error("Contact lookup failed:", err.response?.data || err.message);
    }

    return null;
}

async function createFreshserviceContact({ name, phone, email }) {
    const payload = {
        first_name: name || "Caller",
        email: email || "",
        work_phone: normalizePhone(phone) || "",
    };

    const res = await axios.post(
        `${FRESHSERVICE_URL}/api/v2/contacts`,
        payload,
        { headers: authHeader }
    );

    return res.data;
}

async function getOrCreateFreshserviceContact({ name, phone, email }) {
    const existing = await findFreshserviceContact({ phone, email });
    if (existing) return existing;

    return await createFreshserviceContact({ name, phone, email });
}

/* ───────────────────────────────────────────── */
/* TICKET HANDLING */
/* ───────────────────────────────────────────── */

async function createFreshserviceTicket({
    requesterId,
    subject,
    description,
    phone,
    email,
}) {
    const payload = {
        requester_id: requesterId,
        subject,
        description,
        phone,
        email,
        status: 2,
        priority: 1,
    };

    const res = await axios.post(
        `${FRESHSERVICE_URL}/api/v2/tickets`,
        payload,
        {
            headers: {
                ...authHeader,
                "Content-Type": "application/json",
            },
        }
    );

    return res.data;
}

async function updateFreshserviceTicket({
    ticketId,
    subject,
    description,
}) {
    await axios.put(
        `${FRESHSERVICE_URL}/api/v2/tickets/${ticketId}`,
        { subject, description },
        {
            headers: {
                ...authHeader,
                "Content-Type": "application/json",
            },
        }
    );
}

/* ───────────────────────────────────────────── */
/* ATTACHMENTS */
/* ───────────────────────────────────────────── */

async function attachTextFileToTicket(ticketId, filename, text) {
    const form = new FormData();
    form.append(
        "attachments[]",
        Buffer.from(text, "utf8"),
        { filename }
    );

    await axios.post(
        `${FRESHSERVICE_URL}/api/v2/tickets/${ticketId}/attachments`,
        form,
        {
            headers: {
                ...authHeader,
                ...form.getHeaders(),
            },
        }
    );
}

/* ───────────────────────────────────────────── */
/* PUBLIC WORKFLOW */
/* ───────────────────────────────────────────── */

async function createOrUpdateTicketWithTranscription({
    clientName,
    phone,
    email,
    subject,
    description,
    transcription,
}) {
    // 1️⃣ Contact
    const contact = await getOrCreateFreshserviceContact({
        name: clientName,
        phone,
        email,
    });

    // 2️⃣ Ticket
    const ticket = await createFreshserviceTicket({
        requesterId: contact.id,
        subject,
        description,
        phone,
        email,
    });

    // 3️⃣ Update description + transcription
    await updateFreshserviceTicket({
        ticketId: ticket.id,
        subject,
        description: description + "\n\n" + transcription,
    });

    // 4️⃣ Attach transcription file
    await attachTextFileToTicket(
        ticket.id,
        `Call Transcription - Ticket ${ticket.id}.txt`,
        transcription
    );

    return ticket;
}

/* ───────────────────────────────────────────── */

module.exports = {
    getOrCreateFreshserviceContact,
    createFreshserviceTicket,
    updateFreshserviceTicket,
    attachTextFileToTicket,
    createOrUpdateTicketWithTranscription,
};
