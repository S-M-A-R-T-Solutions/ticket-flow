import { FaCirclePlus } from 'react-icons/fa6';

import TicketCard from '../../../MyWork/MyWorkTicketCards';

import './ClientTickets.scss';

export default function ClientTickets({ tickets }) {
    return (
        <div className="client-tickets">
            <div className="client-tickets-header">
                <h2>Client Tickets</h2>
                <div className="add-ticket-button">
                    <FaCirclePlus />
                    <div>
                        Add Ticket
                    </div>
                </div>
            </div>
            <div className="ticket-list">
                {tickets && tickets.length > 0 ? (
                    tickets.map(ticket => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                    ))
                ) : (
                    <p>No tickets available for this client.</p>
                )}
            </div>
        </div>
    );
}