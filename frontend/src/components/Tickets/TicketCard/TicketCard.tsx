import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';

import moment from 'moment';

import { BsBuildingsFill, BsFillPersonFill } from "react-icons/bs";

import { getAllStatusThunk } from '../../../store/status';

// import ConfirmDeleteTicket from "../../ConfirmDeleteTicket";
// import OpenModalMenuItem from '../../Navigation/OpenModalMenuItem';
// import { FaTrash } from 'react-icons/fa';

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

function PerforatedZone() {
    return (
        <div className="perforated-zone">
            <div className="perforated-line"></div>
        </div>
    );
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
            <NavLink to={"/tickets/" + ticket.id} className={`ticket-card-new status-${ticketStatus}`}>
                <div className='ticket-header'>
                    <div className="ticket-title">{ticket.title}</div>
                    {/* Add relative time using moment */}
                    <div
                        className="ticket-date"
                    >
                        {moment(ticket.createdAt).fromNow()}
                    </div>
                </div>

                {typeof (ticket.createdBy) !== "number" && (<div className='ticket-author'>
                    Created by: <strong>{ticket.createdBy.firstName}</strong>
                </div>)}

                {ticket.clientId.companyName !== '' ? (
                    <div className='client-corporate'>
                        <BsBuildingsFill />
                        {ticket.clientId.companyName}
                    </div>
                ) : (
                    <>
                        <div className='client-individual'>
                            <BsFillPersonFill />
                            {ticket.clientId.firstName} {ticket.clientId.lastName}
                        </div>
                    </>
                )}

                <PerforatedZone />

                <div className='ticket-description'>{ticket.description}</div>

            </NavLink>

            {/* {user.id === ticket.createdBy.id && (
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
            )} */}
        </div>
    );
}