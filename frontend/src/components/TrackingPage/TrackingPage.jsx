import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTicketByHashThunk } from '../../store/tickets';
import { BsBuildingsFill, BsFillPersonFill } from "react-icons/bs";

import './TrackingPage.scss';

function PerforatedZone() {
    return (
        <div className="perforated-zone">
            <div className="perforated-line"></div>
        </div>
    );
}

const TICKET_STATUSES = [
    {
        name: "Open",
        description: "The ticket has been created and is waiting to be assigned or reviewed."
    },
    {
        name: "In Progress",
        description: "Our team is actively working on resolving the issue described in the ticket."
    },
    {
        name: "Completed",
        description: "The work related to this ticket has been finished and the issue is resolved."
    }
];


function TicketStatusLegend() {
    return (
        <div className="status-legend">
            <h4 style={{ fontSize: '12px', fontWeight: '300' }}>What Do Ticket Statuses Mean?</h4>
            <ul>
                {TICKET_STATUSES.map((status, idx) => (
                    <li key={idx} className="status-item" style={{ listStyle: 'none', fontSize: '10px'}}>
                        <strong>{status.name}:</strong> {status.description}
                    </li>
                ))}
            </ul>
        </div>
    );
}


const TicketTrackingPage = () => {
    const { ticketHashedId } = useParams();

    const dispatch = useDispatch();
    const ticket = useSelector(state => state.tickets.ticketByHash);
    const isLoading = useSelector(state => state.tickets.isLoading);
    const error = useSelector(state => state.tickets.error);

    useEffect(() => {
        if (ticketHashedId) {
            dispatch(getTicketByHashThunk(ticketHashedId));
        }
    }, [dispatch, ticketHashedId]);

    if (isLoading) {
        return (
            <div className="ticket-details-tab">
                <span className="loader"></span>
            </div>
        );
    }

    if (error) {
        return (
            <section className="app-section ticket-tracking">
                <div className="tracking-header">
                    <h1>We hit a snag</h1>
                </div>
                <div className="tracking-card error">
                    <p>{error}</p>
                    <p>Please contact support if this issue persists.</p>
                </div>
            </section>
        );
    }

    if (!ticket) {
        return (
            <section className="app-section ticket-tracking">
                <div className="tracking-header">
                    <h1>Ticket Not Found</h1>
                </div>
                <div className="tracking-card not-found">
                    <p>It seems this ticket does not exist or the link is incorrect.</p>
                </div>
            </section>
        );
    }

    const { id, StatusInfo, createdAt, updatedAt, description } = ticket;

    return (
        <section className="app-section-ticket-tracking">
            <div className="tracking-header">
                <div className='header-left'>
                    <h1>Ticket Status Report</h1>
                    <div className="header-left-dates">
                        <span>
                            Created: {createdAt ? new Date(createdAt).toLocaleDateString() + ' ' + new Date(createdAt).toLocaleTimeString() : 'Unknown'}
                        </span>
                        <span> | </span>
                        <span>
                            Last Update: {updatedAt ? new Date(updatedAt).toLocaleDateString() + ' ' + new Date(updatedAt).toLocaleTimeString() : 'Unknown'}
                        </span>
                    </div>
                </div>
                <span
                    className="ticket-status"
                    title={StatusInfo?.description}
                    style={{ backgroundColor: StatusInfo?.color }}
                >
                    {StatusInfo?.name || 'Status unavailable'}
                </span>
            </div>
            <PerforatedZone />
            <div className="tracking-card">
                <div>
                    <h2>{ticket.title}</h2>
                </div>
                <div className="tracking-details">
                    <div className="tracking-field">
                        <span className="label">Description:</span>
                        <span>{description || 'No description available'}</span>
                    </div>
                </div>
                {/* {
                    ticket.ClientInfo?.companyName === "" ?
                        <div className="client">
                            <div className="client-image">
                                {ticket.ClientInfo?.profilePicUrl ?
                                    <img src={ticket.ClientInfo?.profilePicUrl} alt="Client" /> :
                                    <BsFillPersonFill />
                                }
                            </div>
                            <div className="client-info">
                                <div className="client-name">
                                    {ticket.ClientInfo?.firstName} {ticket.ClientInfo?.lastName}
                                </div>
                            </div>
                        </div> :
                        <div className="client">
                            <div className="client-image">
                                <BsBuildingsFill />
                            </div>
                            <div className="client-info">
                                <div className="client-name">
                                    {ticket.ClientInfo?.companyName}
                                </div>
                            </div>
                        </div>
                } */}
                <TicketStatusLegend />
            </div>
        </section>
    );
};

export default TicketTrackingPage;
