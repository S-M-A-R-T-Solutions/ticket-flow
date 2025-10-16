import { csrfFetch } from './csrf';

//Constants
const GET_ALL_CLIENTS = 'clients/getAllClients';
const GET_TOTAL_CLIENTS_AMOUNT = 'clients/getTotalClientsAmount';
const GET_ALL_LOCATIONS_OF_A_CLIENT = 'clients/getAllLocationsOfAClient';
const GET_ONE_CLIENT = 'clients/getOneClient';
const ADD_CLIENT = 'clients/addClient';
const ADD_LOCATION_TO_A_CLIENT = 'clients/addLocationToAClient';
const EDIT_CLIENT = 'clients/editClient';
const DELETE_CLIENT = 'clients/deleteClient';

const GET_LOCATION = 'clients/getLocation';
const EDIT_LOCATION = 'clients/editLocation';

const ADD_PHONE_NUMBER_TO_A_LOCATION = 'clients/addPhoneNumberToALocation';
const ADD_EMAIL_TO_A_LOCATION = 'clients/addEmailToALocation';
const DELETE_PHONE_NUMBER_FROM_A_LOCATION = 'clients/deletePhoneNumberFromALocation';
const DELETE_EMAIL_FROM_A_LOCATION = 'clients/deleteEmailFromALocation';

//Action Creators
const getAllClients = (clients) => ({
    type: GET_ALL_CLIENTS,
    payload: clients
});

const getTotalClientsAmount = (amount) => ({
    type: GET_TOTAL_CLIENTS_AMOUNT,
    payload: amount
});

const getOneClient = (client) => ({
    type: GET_ONE_CLIENT,
    payload: client
});

const getAllLocationsOfAClient = (locations) => ({
    type: GET_ALL_LOCATIONS_OF_A_CLIENT,
    payload: locations
});

const addClient = (client) => ({
    type: ADD_CLIENT,
    payload: client
});

const addLocationToClient = (location) => ({
    type: ADD_LOCATION_TO_A_CLIENT,
    payload: location
});

const editClient = (client) => ({
    type: EDIT_CLIENT,
    payload: client
});

const deleteClient = (client) => ({
    type: DELETE_CLIENT,
    payload: client
});

const getLocation = (location) => ({
    type: GET_LOCATION,
    payload: location
});

const editLocation = (location) => ({
    type: EDIT_LOCATION,
    payload: location
});

const addPhoneNumberToALocation = (phoneNumber) => ({
    type: ADD_PHONE_NUMBER_TO_A_LOCATION,
    payload: phoneNumber
});

const addEmailToALocation = (email) => ({
    type: ADD_EMAIL_TO_A_LOCATION,
    payload: email
});

const deletePhoneNumberFromALocation = (phoneNumber) => ({
    type: DELETE_PHONE_NUMBER_FROM_A_LOCATION,
    payload: phoneNumber
});

const deleteEmailFromALocation = (email) => ({
    type: DELETE_EMAIL_FROM_A_LOCATION,
    payload: email
});

//Thunks
export const getAllClientsThunk = (page, size) => async (dispatch) => {
    const res = await csrfFetch(`/api/clients?page=${page}&size=${size}`);
    const clients = await res.json();
    dispatch(getAllClients(clients));
};

export const getTotalClientsAmountThunk = () => async (dispatch) => {
    const res = await csrfFetch('/api/clients/');
    const amount = await res.json();
    dispatch(getTotalClientsAmount(amount.length));
};

export const getOneClientThunk = (clientId) => async (dispatch) => {
    const res = await csrfFetch(`/api/clients/${clientId}`);
    const client = await res.json();
    dispatch(getOneClient(client));
};

export const getAllLocationsOfAClientThunk = (clientId) => async (dispatch) => {
    const res = await csrfFetch(`/api/clients/${clientId}/locations`);
    const locations = await res.json();
    dispatch(getAllLocationsOfAClient(locations));
};

export const addClientThunk = (client) => async (dispatch) => {
    const formData = new FormData();

    console.log(client, "THIS IS CLIENT");

    // Append the client information to the form data
    if (client.firstName) formData.append('firstName', client.firstName); else formData.append('firstName', '');
    if (client.lastName) formData.append('lastName', client.lastName); else formData.append('lastName', '');
    if (client.companyName) formData.append('companyName', client.companyName); else formData.append('companyName', '');
    if (client.email) formData.append('email', client.email);
    if (client.phone) formData.append('phone', client.phone);

    // Append the profile picture (file) if it exists
    if (client.profilePicUrl) {
        formData.append('image', client.profilePicUrl); // 'image' is the field name used in multer
    }

    const res = await csrfFetch('/api/clients', {
        method: 'POST',
        headers: {
            // No need to set 'Content-Type' to 'multipart/form-data', it will be automatically handled
        },
        body: formData
    });

    const newClient = await res.json();
    dispatch(addClient(newClient));
};

export const addLocationToAClientThunk = (clientId, location) => async (dispatch) => {
    const res = await csrfFetch(`/api/clients/${clientId}/locations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(location)
    });

    const newLocation = await res.json();
    dispatch(addLocationToClient(newLocation));
};

export const editClientThunk = (clientId, formData) => async (dispatch) => {
    const res = await csrfFetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        body: formData, // FormData automatically sets the correct headers
    });

    const updatedClient = await res.json();
    dispatch(editClient(updatedClient));
};

export const deleteClientThunk = (clientId) => async (dispatch) => {
    const res = await csrfFetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
    });
    const deletedClient = await res.json();
    dispatch(deleteClient(deletedClient));
};

export const getLocationThunk = (clientId, locationId) => async (dispatch) => {
    const res = await csrfFetch(`/api/clients/${clientId}/locations/${locationId}`);
    const location = await res.json();
    dispatch(getLocation(location));
};

export const editLocationThunk = (clientId, locationId, location) => async (dispatch) => {
    const res = await csrfFetch(`/api/clients/${clientId}/locations/${locationId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(location)
    });

    const updatedLocation = await res.json();
    dispatch(editLocation(updatedLocation));
};

export const addPhoneNumberToALocationThunk = (locationId, phoneNumber) => async (dispatch) => {
    const res = await csrfFetch(`/api/locations/${locationId}/phone-numbers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(phoneNumber)
    });

    const newPhoneNumber = await res.json();
    dispatch(addPhoneNumberToALocation(newPhoneNumber));
};

export const addEmailToALocationThunk = (locationId, email) => async (dispatch) => {
    const res = await csrfFetch(`/api/locations/${locationId}/emails`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(email)
    });

    const newEmail = await res.json();
    dispatch(addEmailToALocation(newEmail));
};

export const deletePhoneNumberFromALocationThunk = (phoneNumberId) => async (dispatch) => {
    const res = await csrfFetch(`/api/locations/phone-numbers/${phoneNumberId}`, {
        method: 'DELETE'
    });
    const deletedPhoneNumber = await res.json();
    dispatch(deletePhoneNumberFromALocation(deletedPhoneNumber));
};

export const deleteEmailFromALocationThunk = (emailId) => async (dispatch) => {
    const res = await csrfFetch(`/api/locations/emails/${emailId}`, {
        method: 'DELETE'
    });
    const deletedEmail = await res.json();
    dispatch(deleteEmailFromALocation(deletedEmail));
};

//Reducer
const initialState = {
    allClients: [],
    client: {},
    totalClientsAmount: 0
};

const clientsReducer = (state = initialState, action) => {
    switch (action.type) {
        case GET_ALL_CLIENTS: {
            return { ...state, allClients: action.payload };
        }
        case GET_TOTAL_CLIENTS_AMOUNT: {
            return { ...state, totalClientsAmount: action.payload };
        }
        case GET_ONE_CLIENT: {
            return { ...state, client: action.payload };
        }
        case GET_ALL_LOCATIONS_OF_A_CLIENT: {
            return { ...state, client: { ...state.client, locations: action.payload } };
        }
        case ADD_CLIENT: {
            return { ...state, allClients: [...state.allClients, action.payload] };
        }
        case ADD_LOCATION_TO_A_CLIENT: {
            return { ...state, client: { ...state.client, locations: [...(state.client.locations || []), action.payload] } };
        }
        case EDIT_CLIENT: {
            return {
                ...state,
                allClients: state.allClients.map(client => {
                    if (client.id === action.payload.id) {
                        return action.payload;
                    }
                    return client;
                })
            };
        }
        case DELETE_CLIENT: {
            return {
                ...state,
                allClients: state.allClients.filter(client => client.id !== action.payload.id)
            };
        }
        case GET_LOCATION: {
            return { ...state, client: { ...state.client, location: action.payload } };
        }
        case EDIT_LOCATION: {
            return {
                ...state,
                client: {
                    ...state.client,
                    locations: state.client.locations.map(location => {
                        if (location.id === action.payload.id) {
                            return action.payload;
                        }
                        return location;
                    })
                }
            };
        }
        case ADD_PHONE_NUMBER_TO_A_LOCATION: {
            const updatedLocations = state.client.locations.map(location => {
                if (location.id === action.payload.locationId) {
                    return {
                        ...location,
                        phoneNumbers: [...(location.phoneNumbers || []), action.payload]
                    };
                }
                return location;
            });
            return {
                ...state,
                client: {
                    ...state.client,
                    locations: updatedLocations
                }
            };
        }
        case ADD_EMAIL_TO_A_LOCATION: {
            const updatedLocations = state.client.locations.map(location => {
                if (location.id === action.payload.locationId) {
                    return {
                        ...location,
                        emails: [...(location.emails || []), action.payload]
                    };
                }
                return location;
            });
            return {
                ...state,
                client: {
                    ...state.client,
                    locations: updatedLocations
                }
            };
        }
        case DELETE_PHONE_NUMBER_FROM_A_LOCATION: {
            const updatedLocations = state.client.locations.map(location => {
                if (location.id === action.payload.locationId) {
                    return {
                        ...location,
                        phoneNumbers: location.phoneNumbers.filter(phoneNumber => phoneNumber.id !== action.payload.id)
                    };
                }
                return location;
            });
            return {
                ...state,
                client: {
                    ...state.client,
                    locations: updatedLocations
                }
            };
        }
        case DELETE_EMAIL_FROM_A_LOCATION: {
            const updatedLocations = state.client.locations.map(location => {
                if (location.id === action.payload.locationId) {
                    return {
                        ...location,
                        emails: location.emails.filter(email => email.id !== action.payload.id)
                    };
                }
                return location;
            });
            return {
                ...state,
                client: {
                    ...state.client,
                    locations: updatedLocations
                }
            };
        }
        default:
            return state;
    }
}

export default clientsReducer;