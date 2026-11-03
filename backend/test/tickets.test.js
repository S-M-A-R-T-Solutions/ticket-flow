/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

// Load the actual route module with explicit mocks, without starting the app,
// loading credentials, connecting to a database, or making network requests.
function loadTicketRoute() {
    const routes = [];
    const router = {};
    for (const method of ['get', 'post', 'put', 'delete']) {
        router[method] = (routePath, ...handlers) => {
            routes.push({ method, routePath, handlers });
        };
    }

    const tickets = [1, 2, 3].map(id => ({
        id, title: `Synthetic ticket ${id}`, description: 'Test fixture',
        checkIn: null, checkOut: null, hashedId: `fixture-${id}`,
        createdBy: 10, clientId: 20, statusId: 1
    }));
    const notes = [
        { id: 101, ticketId: 1, note: 'First ticket note' },
        { id: 201, ticketId: 2, note: 'Second ticket note' },
        { id: 102, ticketId: 1, note: 'Another first ticket note' }
    ];
    const noteQueries = [];
    const models = {
        Ticket: { findByPk: async id => tickets.find(ticket => ticket.id === Number(id)) },
        User: { findByPk: async () => ({ username: 'fixture-user' }) },
        Client: { findByPk: async () => ({ id: 20, dataValues: {} }) },
        Status: { findByPk: async () => ({ id: 1, name: 'Open' }) },
        Note: {
            findAll: async options => {
                noteQueries.push(options);
                return notes.filter(note =>
                    !options.where || note.ticketId === options.where.ticketId
                );
            }
        }
    };
    for (const name of ['Location', 'TicketPart', 'TicketEmployee', 'TwilioCall', 'TwilioRecording']) {
        models[name] = { findAll: async () => [] };
    }
    const requireAuth = (_req, _res, next) => next();
    const dependencies = {
        express: { Router: () => router },
        '@db/models': models,
        '@utils/randomGenerator': () => 'unused',
        '@utils/auth': { requireAuth },
        '@utils/validation': { properUserValidation() {}, properNoteValidation() {} },
        sequelize: {}
    };
    const filename = path.join(__dirname, '../routes/api/tickets.js');
    const source = fs.readFileSync(filename, 'utf8');
    const module = { exports: {} };
    const execute = vm.runInThisContext(
        `(function(require, module, exports) {\n${source}\n})`,
        { filename }
    );
    execute(name => {
        assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
        return dependencies[name];
    }, module, module.exports);
    const route = routes.find(item => item.method === 'get' && item.routePath === '/:id');
    assert.ok(route, 'GET /:id remains registered');
    assert.equal(route.handlers.length, 2);
    assert.equal(route.handlers[0], requireAuth, 'authentication middleware remains attached');

    async function getTicket(id) {
        const response = {
            statusCode: 200,
            status(code) { this.statusCode = code; return this; },
            json(body) { this.body = body; return this; }
        };
        let forwardedError;
        await route.handlers[1]({ params: { id: String(id) } }, response, error => {
            forwardedError = error;
        });
        assert.ifError(forwardedError);
        return response;
    }
    return { getTicket, noteQueries, notes };
}

test('ticket details return only notes belonging to each requested ticket', async () => {
    const { getTicket, noteQueries, notes } = loadTicketRoute();
    for (const id of [1, 2]) {
        const response = await getTicket(id);
        assert.equal(response.statusCode, 200);
        assert.equal(response.body.id, id);
        assert.deepEqual(response.body.Notes, notes.filter(note => note.ticketId === id));
        assert.deepEqual(Object.keys(response.body).sort(), [
            'id', 'title', 'description', 'checkIn', 'checkOut', 'hashedId',
            'AssignedEmployees', 'CreatedBy', 'ClientInfo', 'Parts', 'Notes',
            'StatusInfo', 'CallInfo', 'Recordings'
        ].sort());
    }
    assert.deepEqual(noteQueries, [
        { where: { ticketId: 1 } },
        { where: { ticketId: 2 } }
    ]);
});

test('ticket without notes returns an empty Notes array', async () => {
    const { getTicket, noteQueries } = loadTicketRoute();
    const response = await getTicket(3);
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body.Notes, []);
    assert.deepEqual(noteQueries, [{ where: { ticketId: 3 } }]);
});

test('unknown ticket returns the existing 404 without querying notes', async () => {
    const { getTicket, noteQueries } = loadTicketRoute();
    const response = await getTicket(999);
    assert.equal(response.statusCode, 404);
    assert.deepEqual(response.body, { message: 'Ticket not found' });
    assert.deepEqual(noteQueries, []);
});
