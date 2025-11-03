import { useSelector, useDispatch } from 'react-redux';
import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import moment from 'moment';

import { BsBuildingsFill, BsFillPersonFill } from "react-icons/bs";
import { HiOutlinePlusSm } from "react-icons/hi";

import { getAllStatusThunk } from '../../../store/status';
import { getAllUsersThunk } from '../../../store/session';
// import { assignEmployeeToTicketThunk } from '../../../store/tickets';

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
    const ulRef = useRef<HTMLUListElement>(null);

    const users = useSelector((state: any) => state.session?.allUsers);
    const user = useSelector((state: any) => state.session?.user);
    const status = useSelector((state: any) => state.status);

    const [showAssignDropdown, setShowAssignDropdown] = useState(false);

    const ticketAssignees = ticket.TicketEmployees?.map((te: any) => te.User);

    useEffect(() => {
        dispatch(getAllStatusThunk() as any);
        dispatch(getAllUsersThunk() as any);
    }, [dispatch, ticket.statusId]);

    useEffect(() => {
        if (!showAssignDropdown) return;

        const closeMenu = (e: any) => {
            if (ulRef.current && !ulRef.current.contains(e.target)) {
                setShowAssignDropdown(false);
            }
        }
        document.addEventListener("click", closeMenu);

        return () => document.removeEventListener("click", closeMenu);
    }, [showAssignDropdown]);

    const ulClassName = "assign-employee-dropdown" + (showAssignDropdown ? "" : "-hidden");

    const ticketStatus = ticket.statusId;

    const thisStatus = status.allStatus?.find((status: any) => status.id === ticket.statusId);

    const handleDeleteClick = (e: Event) => {
        e.stopPropagation();
    };

    const toggleMenu = (e: any) => {
        e.preventDefault();
        e.stopPropagation(); // prevent immediate close
        setShowAssignDropdown(!showAssignDropdown);
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

                <div className='ticket-bottom'>
                    <div className='ticket-description'>{ticket.description}</div>
                    <>
                        {ticket.TicketEmployees && ticket.TicketEmployees.length > 0 ? (
                            <div
                                className='ticket-assignees'
                                style={{ zIndex: 5 }}
                                onClick={toggleMenu}
                            >
                                <div className='assign-employee-button'>
                                    <HiOutlinePlusSm />
                                </div>
                                {ticket.TicketEmployees.length < 3 ? (ticket.TicketEmployees.map((employee: any) => (
                                    <div key={employee.id} className='ticket-assignee'>
                                        <img src={employee.User.profilePicUrl || '/default-profile.png'} alt={`${employee.User.firstName[0]} ${employee.User.lastName[0]}`} title={`${employee.User.firstName} ${employee.User.lastName}`} />
                                    </div>
                                ))) : (
                                    <>
                                        <div className='ticket-assignee'>
                                            <img src={ticket.TicketEmployees[0].User.profilePicUrl || '/default-profile.png'} alt={`${ticket.TicketEmployees[0].User.firstName[0]} ${ticket.TicketEmployees[0].User.lastName[0]}`} title={`${ticket.TicketEmployees[0].User.firstName} ${ticket.TicketEmployees[0].User.lastName}`} />
                                        </div>
                                        <div className='ticket-assignee-more'>
                                            + {ticket.TicketEmployees.length - 1}
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className='ticket-assignees'>
                                <div className='assign-employee-button'>
                                    <HiOutlinePlusSm />
                                </div>
                                <div className='ticket-assignee'>
                                    <img src={'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'} />
                                </div>
                            </div>
                        )}
                    </>
                    {showAssignDropdown && (
                        <ul className={ulClassName} ref={ulRef}>
                            {users && users.map((user: any) => (
                                <li
                                    key={user.id}
                                    className="assign-employee-option"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        dispatch(assignEmployeeToTicketThunk(ticket.id, user.id) as any);
                                        setShowAssignDropdown(false);
                                    }}
                                >
                                    <img src={user.profilePicUrl || '/default-profile.png'} alt={`${user.firstName[0]} ${user.lastName[0]}`} />
                                    <span>{user.firstName} {user.lastName}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

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