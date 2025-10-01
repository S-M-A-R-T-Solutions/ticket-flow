import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTicketByHashThunk } from '../../store/tickets';
import './TrackingPage.scss';

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
        <section className="app-section ticket-tracking">
            <div className="tracking-header">
                <h1>Ticket Tracking</h1>
                <span
                    className="ticket-status"
                    title={StatusInfo?.description}
                    style={{ backgroundColor: StatusInfo?.color }}
                >
                    {StatusInfo?.name || 'Status unavailable'}
                </span>
            </div>

            <div className="tracking-card">
                <h2>Ticket #{id}</h2>
                <div className="tracking-details">
                    <div className="tracking-field">
                        <span className="label">Description:</span>
                        <span>{description || 'No description available'}</span>
                    </div>
                    <div className="tracking-field">
                        <span className="label">Created On:</span>
                        <span>{createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    <div className="tracking-field">
                        <span className="label">Last Updated:</span>
                        <span>{updatedAt ? new Date(updatedAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TicketTrackingPage;
