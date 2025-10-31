import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";

import { useModal } from "../../../context/Modal";

import OpenModalMenuItem from "../../Navigation/OpenModalMenuItem";
import AddNote from "../../AddNote/AddNote";
import AssignToClient from "./AssignToClient";

import { FaPlus, FaPhone } from "react-icons/fa";
import { BsBuildingsFill, BsFillPersonFill } from "react-icons/bs";
import { HiOutlineChevronDown } from "react-icons/hi";
import { IoPersonAddOutline } from "react-icons/io5";

import OpenModalButton from "../../OpenModalButton";

import { getTicketThunk, updateTicketThunk, getMyTicketsThunk } from "../../../store/tickets";
import { getAllStatusThunk } from "../../../store/status";
import { getAllNotesThunk } from "../../../store/notes";
import { getAllPartsThunk } from "../../../store/parts";
import TicketPartCard from "../TicketPartCard";

import TicketQR from "./TicketQR";
import TicketEmployees from "./TicketEmployees";
import TicketNoteCard from "../TicketNoteCard/TicketNoteCard";

import { formatPhoneNumber } from "../../../utils/helperFunctions";

import './TicketDetails.scss';

export default function TicketDetails() {
    const { closeModal } = useModal();
    const dispatch = useDispatch();
    const ulRef = useRef<HTMLUListElement>(null);

    const [noteChecker, setNoteChecker] = useState(false);
    const [myWorkTickets, setMyWorkTickets] = useState(false);

    const [partsChecker, setPartsChecker] = useState(false);
    const [ticketChecker, setTicketChecker] = useState(false);

    const [deleteNoteChecker, setDeleteNoteChecker] = useState(false);
    const [deletePartChecker, setDeletePartChecker] = useState(false);

    const [assignToClient, setAssignToClient] = useState(false);

    const [showStatusMenu, setShowStatusMenu] = useState(false);

    const { ticketId } = useParams();

    const user = useSelector((state: any) => state.session.user);
    const status = useSelector((state: any) => state.status.allStatus);
    const notes = useSelector((state: any) => state.notes.allNotes);
    const ticket = useSelector((state: any) => state.tickets.ticket);
    const parts = useSelector((state: any) => state.parts.allParts);

    const [ticketStatus, setTicketStatus] = useState(ticket.id);

    const toggleMenu = (e: any) => {
        e.stopPropagation(); // Keep from bubbling up to document and triggering closeMenu
        setShowStatusMenu(!showStatusMenu);
    }

    useEffect(() => {
        dispatch(getTicketThunk(parseInt(ticketId || '')) as any);
        dispatch(getAllStatusThunk() as any);
        dispatch(getAllNotesThunk() as any);
        dispatch(getMyTicketsThunk() as any);
        dispatch(getAllPartsThunk() as any);
        setTicketChecker(false);
        setDeleteNoteChecker(false);
        setPartsChecker(false);
        setDeletePartChecker(false);
        setAssignToClient(false);
    }, [dispatch, ticketId, noteChecker,
        deleteNoteChecker, myWorkTickets,
        deletePartChecker, partsChecker,
        ticketChecker, assignToClient]);

    useEffect(() => {
        setNoteChecker(false)
    }, [noteChecker])

    useEffect(() => {
        setPartsChecker(false);
    }, [partsChecker])

    useEffect(() => {
        setMyWorkTickets(false);
    }, [myWorkTickets])

    useEffect(() => {
        if (!showStatusMenu) return;

        const closeMenu = (e: any) => {
            if (!ulRef.current?.contains(e.target)) {
                setShowStatusMenu(false);
            }
        };

        document.addEventListener("click", closeMenu);

        return () => document.removeEventListener("click", closeMenu);
    }, [showStatusMenu]);

    const ulClassName = "status-dropdown-menu" + (showStatusMenu ? "" : "-hidden");

    if (!ticket || !status || !user || !notes || !parts) return <div className="ticket-details-tab"><span className="loader"></span></div>;

    const newStatus = status.filter((status: any) => status.id !== ticket.StatusInfo?.id);
    const notesForTicket = notes.filter((note: any) => note.ticketId === ticket.id);
    const partsForTicket = parts.filter((part: any) => part.Ticket?.id === ticket.id);

    const handleStatusChange = (e: any) => {
        dispatch(updateTicketThunk(ticket.id, { ...ticket, statusId: parseInt(e.target.value), StatusInfo: status.find((status: any) => status.id === parseInt(e.target.value)) }) as any);
        setTicketStatus(parseInt(e.target.value));
        setMyWorkTickets(true);
        setShowStatusMenu(false);
    }

    const onModalClose = () => {
        setNoteChecker(true);
        setDeleteNoteChecker(true);
        setAssignToClient(true);
    }

    const onModalCloseTickets = () => {
        setTicketChecker(true);
    }

    const onModalCloseParts = () => {
        setPartsChecker(true);
        setDeletePartChecker(true);
    }

    const clientClassName = ticket.ClientInfo?.companyName === "" ? "individual-client" : "company-client";

    const getPhoneDirectoryOfAClient = () => {
        const result = [];
        ticket.ClientInfo?.Locations?.forEach((location: any) => {
            location.PhoneNumbers?.forEach((phoneNumber: any) => {
                result.push(phoneNumber);
            });
        });

        result.push({ phoneNumber: ticket.ClientInfo?.phone, phoneType: "Main" });
        return result;
    }

    const phoneDirectory = getPhoneDirectoryOfAClient();
    console.log("PHONE DIRECTORY:", phoneDirectory);

    const selectedContactInfo: { phoneNumber?: string; phoneType?: string, locationName?: string } = {};
    console.log("TICKET CALLER INFO:", ticket.CallInfo[0]);

    if (ticket.CallInfo?.length > 0) {
        phoneDirectory.forEach((contactInfo: { phoneNumber: string; phoneType: string; }) => {
            if (contactInfo.phoneNumber === ticket.CallInfo[0]?.caller) {
                selectedContactInfo['phoneNumber'] = contactInfo.phoneNumber;
                selectedContactInfo['phoneType'] = contactInfo.phoneType;
                selectedContactInfo['locationName'] = ticket.CallInfo[0]?.locationName;
            }
        });
    } else {
        Object.assign(selectedContactInfo, { phoneNumber: ticket.ClientInfo?.phone, phoneType: "Client Phone" });
    }

    const locationInfoExists = selectedContactInfo.locationName ? `exists` : "";

    console.log("SELECTED CONTACT INFO:", selectedContactInfo);


    return (
        <section className="app-section ticket-details">
            <div className="section-header">

                <h1>
                    {ticket.title}
                    <span
                        className="ticket-status"
                        title={ticket.StatusInfo?.description}
                        style={{ backgroundColor: ticket.StatusInfo?.color }}
                        onClick={toggleMenu}
                    >
                        {ticket.StatusInfo?.name}
                        <HiOutlineChevronDown className="status-dropdown-icon" />
                    </span>
                    {ticket ? (
                        <ul className={ulClassName} ref={ulRef}>
                            {newStatus.map((statusOption: any) => (
                                <li key={statusOption.id}>
                                    <button
                                        className={`status-option-button-${statusOption.id}`}
                                        value={statusOption.id}
                                        onClick={(e) => handleStatusChange(e)}
                                    >
                                        <span
                                            className="status-color-indicator"
                                            style={{ backgroundColor: statusOption.color }}
                                        ></span>
                                        {statusOption.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (null)}
                </h1>

                {ticket.ClientInfo?.id === 28 ? ( //Anonymous Client Case
                    <div style={{ display: "flex", flexDirection: "row", alignContent: "center", justifyContent: "center", gap: "20px" }}>
                        <div
                            className="caller-info"
                            onClick={() => { window.location.href = `tel:${ticket.CallInfo[0]?.caller}`; }}
                        >
                            {/* Search for Caller Number in ticket.CallInfo[0] */}
                            <div className="phone-button">
                                <FaPhone />
                            </div>
                            <div className="phone-number-and-title">
                                <span className="phone-number-label">{formatPhoneNumber(ticket.CallInfo[0]?.caller)}</span>
                            </div>
                        </div>
                        <div className="assign-client">
                            <OpenModalMenuItem
                                modalComponent={<AssignToClient setAssignToClient={setAssignToClient} />}
                                onModalClose={onModalClose}
                            >
                                <IoPersonAddOutline className="assign-client-icon" />
                                Assign Client
                            </OpenModalMenuItem>
                        </div>
                    </div>) : ( // Assigned Client Case
                    <div style={{ display: "flex", flexDirection: "row", alignContent: "center", justifyContent: "center", gap: "20px", padding: 0 }}>
                        {ticket.ClientInfo?.companyName === "" ? (
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
                            </div>) : (

                            <div className={`client-${clientClassName}`}>
                                <div className="client-image">
                                    <BsBuildingsFill />
                                </div>

                                <div className="client-info">
                                    <div className="client-name">
                                        {ticket.ClientInfo?.companyName}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="caller-info-ticket">
                            <div className="location-name-location-phone" onClick={() => { window.location.href = `tel:${ticket.CallInfo[0]?.caller}`; }}>
                                <div className={`caller-location-name-${locationInfoExists}`}>
                                    <span> {selectedContactInfo.locationName} </span>
                                </div>
                                <div className="caller-location-phone-number">
                                    <div className="caller-location-phone-type">
                                        <span>{selectedContactInfo.phoneType}</span>
                                    </div>
                                    <div className="caller-location-phone-number-number">
                                        <span>{formatPhoneNumber(selectedContactInfo.phoneNumber)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* {ticket.CallInfo?.length > 0 ? ( //Client has call info
                            <div className="caller-info-ticket">
                                {ticket.ClientInfo?.Locations?.map((location: any) => (
                                    phoneDirectory.map((phoneNumber: any) => (
                                        phoneNumber.phoneNumber === ticket.CallInfo[0]?.caller ? (
                                            <div className="location-name-location-phone" key={phoneNumber.id} onClick={() => { window.location.href = `tel:${ticket.CallInfo[0]?.caller}`; }}>
                                                <div className="caller-location-name">
                                                    <span> {location.name} </span>
                                                </div>
                                                <div className="caller-location-phone-number">
                                                    <div className="caller-location-phone-type">
                                                        <span key={phoneNumber.id}>{phoneNumber.phoneType}</span>
                                                    </div>
                                                    <div className="caller-location-phone-number-number">
                                                        <span key={phoneNumber.id}>{formatPhoneNumber(phoneNumber.phoneNumber)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="caller-info-ticket">
                                                <div className="location-name-location-phone" onClick={() => { window.location.href = `tel:${ticket.CallInfo[0]?.caller}`; }}>
                                                    <div className="caller-location-phone-number">
                                                        <div className="caller-location-phone-type">
                                                            <FaPhone style={{ transform: "rotate(90deg)" }} />
                                                        </div>
                                                        <div className="caller-location-phone-number-number">
                                                            <span>{formatPhoneNumber(ticket.ClientInfo?.phone)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ))
                                    // location.PhoneNumbers?.map((phoneNumber: any) => (
                                    //     phoneNumber.phoneNumber === ticket.CallInfo[0]?.caller ? (
                                    //         <div className="location-name-location-phone" key={phoneNumber.id} onClick={() => { window.location.href = `tel:${ticket.CallInfo[0]?.caller}`; }}>
                                    //             <div className="caller-location-name">
                                    //                 <span> {location.name} </span>
                                    //             </div>
                                    //             <div className="caller-location-phone-number">
                                    //                 <div className="caller-location-phone-type">
                                    //                     <span key={phoneNumber.id}>{phoneNumber.phoneType}</span>
                                    //                 </div>
                                    //                 <div className="caller-location-phone-number-number">
                                    //                     <span key={phoneNumber.id}>{formatPhoneNumber(phoneNumber.phoneNumber)}</span>
                                    //                 </div>
                                    //             </div>
                                    //         </div>
                                    //     ) : (
                                    //         <div className="caller-info-ticket">
                                    //             <div className="location-name-location-phone" onClick={() => { window.location.href = `tel:${ticket.CallInfo[0]?.caller}`; }}>
                                    //                 <div className="caller-location-phone-number">
                                    //                     <div className="caller-location-phone-type">
                                    //                         <FaPhone style={{ transform: "rotate(90deg)" }} />
                                    //                     </div>
                                    //                     <div className="caller-location-phone-number-number">
                                    //                         <span>{formatPhoneNumber(ticket.ClientInfo?.phone)}</span>
                                    //                     </div>
                                    //                 </div>
                                    //             </div>
                                    //         </div>
                                    //     )
                                    // ))
                                ))}
                                <div className="location-name-location-phone" onClick={() => { window.location.href = `tel:${ticket.CallInfo[0]?.caller}`; }}>
                                    <div className="caller-location-phone-number">
                                        <div className="caller-location-phone-type">
                                            <FaPhone style={{ transform: "rotate(90deg)" }} />
                                        </div>
                                        <div className="caller-location-phone-number-number">
                                            <span>{formatPhoneNumber(ticket.ClientInfo?.phone)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="caller-info-ticket">
                                <div className="location-name-location-phone" onClick={() => { window.location.href = `tel:${ticket.CallInfo[0]?.caller}`; }}>
                                    <div className="caller-location-phone-number">
                                        <div className="caller-location-phone-type">
                                            <FaPhone style={{ transform: "rotate(90deg)" }} />
                                        </div>
                                        <div className="caller-location-phone-number-number">
                                            <span>{formatPhoneNumber(ticket.ClientInfo?.phone)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )} */}
                    </div>
                )}
            </div>


            <div className="ticket-details-container">
                <div className="ticket-info">
                    <div className="ticket-description">
                        <div className="description-title">Description</div>
                        <div className="description-content">{ticket.description}</div>
                    </div>

                    <TicketEmployees author={ticket.CreatedBy} employees={ticket.AssignedEmployees} />
                </div>

                <div className="share-container">
                    <TicketQR ticketHashedId={ticket.hashedId} />
                </div>
            </div>

            <div className="notes-and-parts">
                <div className="notes-container">
                    <div className="notes-header">
                        <div className="notes-title">Notes</div>

                        <OpenModalMenuItem
                            modalComponent={<AddNote userId={user.id} ticketId={ticket.id} setNotesChecker={setNoteChecker} />}
                            onModalClose={onModalClose}
                        >
                            <button className="btn btn-icon btn-add-note" title="Add Note to Ticket">
                                <FaPlus className="btn-icon-icon" />
                            </button>
                        </OpenModalMenuItem>
                    </div>

                    <div className="notes-list">
                        {
                            notesForTicket.length > 0 ? (
                                notesForTicket?.map((note: any) => (
                                    <TicketNoteCard key={note.id} note={note} setDeleteNoteChecker={setDeleteNoteChecker} />
                                ))
                            ) : (
                                <span>No notes for this ticket</span>
                            )
                        }
                    </div>
                </div>

                <div className="parts-container">
                    <div className="parts-header">
                        <div className="parts-title">Parts</div>

                        <button className="btn btn-icon btn-add-part" title="Add Part to Ticket">
                            <FaPlus className="btn-icon-icon" />
                        </button>
                    </div>

                    {ticket.Parts?.length > 0 ?
                        <div className="parts-list">
                            {
                                ticket.Parts.map((part: any) => (
                                    <TicketPartCard key={part.id} part={part} setDeletePartChecker={setDeletePartChecker} ticketAuthor={ticket.CreatedBy?.id} setPartsChecker={setPartsChecker} />
                                ))
                            }
                        </div> :
                        <div className="no-parts-placeholder">No parts for this ticket</div>
                    }
                </div>
            </div>
        </section>
    );
}