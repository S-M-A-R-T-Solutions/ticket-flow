import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FaTrash } from 'react-icons/fa';
import { BsBuildingsFill, BsFillPersonFill } from "react-icons/bs";
import { useEffect } from 'react';
import { getAllStatusThunk } from '../../../store/status';
import ConfirmDeleteTicket from "../../ConfirmDeleteTicket";
import OpenModalMenuItem from '../../Navigation/OpenModalMenuItem';
import { NavLink } from 'react-router-dom';

import './TicketCard.scss';

function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (now.getFullYear() === date.getFullYear()) {
        return `${month}/${day}`;
    } else {
        return `${month}/${day}/${date.getFullYear()}`;
    }
}

interface TicketCardProps {
    ticket: any;
    setDeleteTicketChecker: any;
}

export default function ({ ticket, setDeleteTicketChecker }: TicketCardProps) {
    const dispatch = useDispatch();
    const user = useSelector((state: any) => state.session.user);
    const status = useSelector((state: any) => state.status);

    useEffect(() => {
        // dispatch(getAllStatusThunk(ticket.statusId) as any);
        dispatch(getAllStatusThunk() as any);
    }, [dispatch, ticket.statusId]);

    const ticketStatus = ticket.statusId;

    const thisStatus = status.allStatus?.find((status: any) => status.id === ticket.statusId);

    const handleDeleteClick = (e: Event) => {
        e.stopPropagation();
    };

    return (
        <div className="ticket-card-wrapper">
            <NavLink to={"/tickets/" + 1} className={`ticket-card-new status-${ticketStatus}`}>
                <div className="ticket-title">{ticket.title}</div>

                {typeof (ticket.createdBy) !== "number" && (<div className='ticket-author'>
                    Created by: <strong>{ticket.createdBy.firstName}</strong>
                </div>)}

                {ticket.clientId.companyName !== '' ? (
                    <div className='client-corporate'>
                        <BsBuildingsFill />
                        {ticket.clientId.companyName}
                    </div>
                ) : (
                    <div className='client-individual'>
                        <BsFillPersonFill />
                        {ticket.clientId.firstName} {ticket.clientId.lastName}
                    </div>
                )}

                <div className='ticket-description'>{ticket.description}</div>

                <div className="ticket-date">{formatDate(ticket.createdAt)}</div>
            </NavLink>

            {user.id === ticket.createdBy.id && (
                <div className="delete-ticket-wrapper">
                    <OpenModalMenuItem
                        modalComponent={
                            <ConfirmDeleteTicket ticket={ticket} setDeleteTicketChecker={setDeleteTicketChecker} />
                        }
                        onModalClose={() => { }}

                    >
                        <button className="btn btn-delete-ticket">
                            <FaTrash className="btn-icon-icon" />
                        </button>
                    </OpenModalMenuItem>
                </div>
            )}
        </div>
    );
}