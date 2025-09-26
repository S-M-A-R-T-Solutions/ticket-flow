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
            <NavLink to={"/tickets/" + 1} className="ticket-card-new">
                <h3 className="ticket-title">{ticket.title}</h3>

                {typeof (ticket.createdBy) !== "number" && (<>
                    <span>Created by: {ticket.createdBy.firstName}</span>
                    <p>{ticket.description}</p>
                </>)}

                {ticket.clientId.companyName !== '' ? (
                    <div className='client-corporate'>
                        <BsBuildingsFill />
                        <span>{ticket.clientId.companyName}</span>
                    </div>
                ) : (
                    <div className='client-individual'>
                        <BsFillPersonFill />
                        <span style={{ textOverflow: "ellipsis" }}>{ticket.clientId.firstName} {ticket.clientId.lastName}</span>
                    </div>
                )}

                <p>{formatDate(ticket.createdAt)}</p>



            </NavLink>

            {user.id === ticket.createdBy.id && (
                <div className="delete-ticket-wrapper">
                    <OpenModalMenuItem
                        modalComponent={
                            <ConfirmDeleteTicket ticket={ticket} setDeleteTicketChecker={setDeleteTicketChecker} />
                        }
                        onModalClose={() => { }}

                    >
                        <button className="btn btn-icon btn-danger">
                            <FaTrash />
                        </button>
                    </OpenModalMenuItem>
                </div>
            )}
        </div>
    );
}