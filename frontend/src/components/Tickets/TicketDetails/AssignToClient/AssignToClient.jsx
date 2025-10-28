import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';

import { getAllClientsThunk } from '../../../../store/clients';
import { updateTicketThunk } from '../../../../store/tickets';

import { useModal } from '../../../../context/Modal';

import './AssignToClient.scss';

export default function AssignToClient({ setAssignToClient }) {
    const dispatch = useDispatch();

    const clients = useSelector(state => state.clients.allClients);
    const ticket = useSelector(state => state.tickets.ticket);

    const [selectedClient, setSelectedClient] = useState(null);

    const { closeModal } = useModal();

    console.log("Ticket in AssignToClient:", ticket);

    useEffect(() => {
        // Dispatch action to fetch clients if not already fetched
        dispatch(getAllClientsThunk());
    }, [dispatch]);

    const handleAssign = () => {
        if (selectedClient) {
            // Dispatch action to assign ticket to selected client
            dispatch(updateTicketThunk(ticket.id, { clientId: selectedClient }));
            setAssignToClient(true);
            closeModal();
        }
    }

    const selectedClientObj = clients?.find(client => client.id === selectedClient);

    console.log("Selected Client Object:", selectedClientObj);
    
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
                            <h2>{selectedClientObj.firstName} {selectedClientObj.lastName} {selectedClientObj.companyName}</h2>

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