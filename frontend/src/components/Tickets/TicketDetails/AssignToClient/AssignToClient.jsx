import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';

import { getAllClientsThunk, getOneClientThunk, getAllLocationsOfAClientThunk, editClientThunk, addPhoneNumberToALocationThunk } from '../../../../store/clients';
import { updateTicketThunk } from '../../../../store/tickets';

import { useModal } from '../../../../context/Modal';

import { formatPhoneNumber } from '../../../../utils/helperFunctions';

import './AssignToClient.scss';

export default function AssignToClient({ setAssignToClient }) {
    const dispatch = useDispatch();

    const clients = useSelector(state => state.clients?.allClients);
    const selectedClientObject = useSelector(state => state.clients?.client);
    const ticket = useSelector(state => state.tickets.ticket);
    const clientLocations = useSelector(state => state.clients.client?.locations);    

    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);

    const [phoneName, setPhoneName] = useState('');

    const [buttonDisabled, setButtonDisabled]  = useState(true);

    const handleAssignCallToLocation = (locationId) => {
        setSelectedLocation(locationId);
    }

    const { closeModal } = useModal();

    // Fetch all clients on component mount
    useEffect(() => {
        dispatch(getAllClientsThunk());
    }, [dispatch]);

    //Fetch the client information when a client is selected
    useEffect(() => {
        if (selectedClient) {
            dispatch(getOneClientThunk(selectedClient));
        }
    }, [dispatch, selectedClient]);

    // Fetch locations when a client is selected
    useEffect(() => {
        if (selectedClient) {
            dispatch(getAllLocationsOfAClientThunk(selectedClient));
        }
    }, [dispatch, selectedClient]);


    const handleAssign = () => {
        if(selectedClient && !clientLocations) {
            const updatedTicket = new FormData();
            updatedTicket.append('phone', ticket.CallInfo[0]?.caller || '');

            dispatch(editClientThunk(selectedClient, updatedTicket));
        }

        if(selectedClient && selectedLocation) {
            const newLocationPhoneNumber = {
                phoneNumber: ticket.CallInfo[0]?.caller || '',
                phoneType: phoneName || 'New Contact'
            }
            dispatch(addPhoneNumberToALocationThunk(selectedLocation, newLocationPhoneNumber));

        }

        const updatedTicket = {
            title: ticket.title,
            createdBy: ticket.createdBy,
            clientId: selectedClient,
            description: ticket.description,
            checkIn: ticket.checkIn,
            checkOut: ticket.checkOut,
            statusId: ticket.statusId,
            hashedId: ticket.hashedId
        };

        dispatch(updateTicketThunk(ticket.id, updatedTicket));
        setAssignToClient(false);
        closeModal();
    }

    console.log("SELECTED CLIENT LOCATIONS:", selectedLocation);

    return (
        <div className="assign-to-client">
            <h3>Assign Ticket to Client</h3>
            <div className='assign-to-client-wrapper'>
                <div className='assign-to-client-left'>
                    <table>
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>Client Name</th>
                                <th>Company</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients && clients.map(client => (
                                <tr key={client.id}>
                                    <td>
                                        <input
                                            type="radio"
                                            name="selectedClient"
                                            value={client.id}
                                            onChange={() => setSelectedClient(client.id)}
                                            checked={selectedClient === client.id}
                                        />
                                    </td>
                                    <td>{client.firstName} {client.lastName}</td>
                                    <td>{client.companyName}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className='assign-to-client-right'>
                    {selectedClient ? (
                        <>
                            <h2>Select the location</h2>
                            <div className='phone-number-information'>
                                <input type="text" value={phoneName} onChange={(e) => setPhoneName(e.target.value)} />
                                <input type="text" value={formatPhoneNumber(ticket.CallInfo[0]?.caller) || 'No phone number available'} readOnly />
                            </div>
                            <h3>Locations:</h3>
                            {clientLocations && clientLocations.length > 0 ? (
                                <div className='locations-list'>
                                    {clientLocations.map(location => (
                                        <div key={location.id} className={`location-card-location${selectedLocation === location.id ? '-selected' : ''}`} onClick={() => handleAssignCallToLocation(location.id)}>
                                            <div className='location-card-right'>
                                                <h4>{location.name}</h4>
                                                <p>{location.addressLine1} {location.city}, {location.state} {location.zipCode}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>No locations found for this client.</p>
                            )}
                        </>
                    ) : (
                        <p>Please select a client to assign the ticket.</p>
                    )}
                </div>
            </div>
            <button onClick={handleAssign} disabled={!selectedClient}>Assign</button>
        </div>
    )
}