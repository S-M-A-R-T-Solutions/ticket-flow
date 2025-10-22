import { csrfFetch } from "./csrf";

//CONSTANTS
const GET_ALL_TICKETS = 'tickets/getAllTickets';
const GET_TOTAL_TICKETS_AMOUNT = 'tickets/getTotalTicketsAmount';
const GET_MY_TICKETS = 'tickets/getMyTickets';
const GET_TICKET = 'tickets/getTicket';
const ADD_TICKET = 'tickets/addTicket';
const UPDATE_TICKET = 'tickets/updateTicket';
const DELETE_TICKET = 'tickets/deleteTicket';
const GET_TICKET_BY_HASH = 'tickets/getTicketByHash';

const ADD_NOTE_TO_TICKET = 'tickets/addNoteToTicket';

//ACTION CREATORS
const getAllTickets = (tickets) => ({
    type: GET_ALL_TICKETS,
    payload: tickets
});

const getTotalTicketsAmount = (amount) => ({
    type: GET_TOTAL_TICKETS_AMOUNT,
    payload: amount
});

const getTicketByHash = (ticket) => ({
    type: GET_TICKET_BY_HASH,
    payload: ticket
});

const getMyTickets = (tickets) => ({
    type: GET_MY_TICKETS,
    payload: tickets
});

const getTicket = (ticket) => ({
    type: GET_TICKET,
    payload: ticket
});

const addTicket = (ticket) => ({
    type: ADD_TICKET,
    payload: ticket
});

const updateTicket = (ticket) => ({
    type: UPDATE_TICKET,
    payload: ticket
});

const deleteTicket = (ticket) => ({
    type: DELETE_TICKET,
    payload: ticket
});

const addNoteToTicket = (note) => ({
    type: ADD_NOTE_TO_TICKET,
    payload: note
});

//THUNKS
export const getAllTicketsThunk = (page, size) => async (dispatch) => {
    // console.log(page, size, "page and size");
    const res = await csrfFetch(`/api/tickets?page=${page}&size=${size}`);
    const tickets = await res.json();
    dispatch(getAllTickets(tickets));
};

export const getTicketByHashThunk = (hashedId) => async (dispatch) => {
    const res = await csrfFetch(`/api/tickets/track/${hashedId}`);
    console.log(res, "THIS IS RES");
    const ticket = await res.json();
    dispatch(getTicketByHash(ticket));
}

export const getTotalTicketsAmountThunk = () => async (dispatch) => {
    const res = await csrfFetch(`/api/tickets/`);
    const amount = await res.json();
    // console.log(amount, "amount");
    dispatch(getTotalTicketsAmount(amount.length));
}

export const getMyTicketsThunk = () => async (dispatch) => {
    const res = await csrfFetch(`/api/tickets/current`);
    const tickets = await res.json();
    dispatch(getMyTickets(tickets));
}

export const getTicketThunk = (id) => async (dispatch) => {
    const res = await csrfFetch(`/api/tickets/${id}`);
    const ticket = await res.json();
    dispatch(getTicket(ticket));
}

export const addTicketThunk = (ticket) => async (dispatch) => {
    const res = await csrfFetch('/api/tickets', {
        method: 'POST',
        body: JSON.stringify(ticket)
    });
    const newTicket = await res.json();
    dispatch(addTicket(newTicket));
}

export const updateTicketThunk = (ticket) => async (dispatch) => {
    const res = await csrfFetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        body: JSON.stringify(ticket)
    });
    const updatedTicket = await res.json();
    dispatch(updateTicket(updatedTicket));
}

export const deleteTicketThunk = (id) => async (dispatch) => {
    const res = await csrfFetch(`/api/tickets/${id}`, {
        method: 'DELETE'
    });
    const deletedTicket = await res.json();
    dispatch(deleteTicket(deletedTicket));
}

export const addNoteToTicketThunk = (note, ticketId) => async (dispatch) => {
    const res = await csrfFetch(`/api/tickets/${ticketId}/notes`, {
        method: 'POST',
        body: JSON.stringify(note)
    });
    const newNote = await res.json();
    dispatch(addNoteToTicket(newNote));
}


//REDUCER
const initialState = {
    allTickets: [],
    myTickets: [],
    ticket: {},
    ticketByHash: {},
    totalTicketsAmount: 0
};

const ticketsReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_ALL_TICKETS: {
            return { ...state, allTickets: action.payload };
        }
        case GET_TOTAL_TICKETS_AMOUNT: {
            return { ...state, totalTicketsAmount: action.payload };
        }
        case GET_TICKET_BY_HASH: {
            return { ...state, ticketByHash: action.payload };
        }
        case GET_MY_TICKETS: {
            return { ...state, myTickets: action.payload };
        }
        case GET_TICKET: {
            return { ...state, ticket: action.payload };
        }
        case ADD_TICKET: {
            return { ...state, myTickets: [...state.myTickets, action.payload] };
        }
        case UPDATE_TICKET: {
            return { ...state, myTickets: state.myTickets.map(ticket => ticket.id === action.payload.id ? action.payload : ticket) };
        }
        case DELETE_TICKET: {
            return { ...state, myTickets: state.myTickets.filter(ticket => ticket.id !== action.payload.id) };
        }
        default:
            return state;
    }
}

export default ticketsReducer;