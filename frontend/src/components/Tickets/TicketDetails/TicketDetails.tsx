import { useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import OpenModalMenuItem from "../../Navigation/OpenModalMenuItem";
import AddNote from "../../AddNote/AddNote";

import { FaBuilding, FaUser, FaPen, FaPlusCircle } from "react-icons/fa";
import { FaTicketAlt } from "react-icons/fa";
import { BsBuildingsFill, BsFillPersonFill } from "react-icons/bs";

import { useEffect, useState } from "react";
import { getTicketThunk, updateTicketThunk, getMyTicketsThunk } from "../../../store/tickets";
import { getAllStatusThunk } from "../../../store/status";
import { getAllNotesThunk } from "../../../store/notes";
import NoteCard from "../../NoteCard";
import { getAllPartsThunk } from "../../../store/parts";
import PartCard from "../../_PartCard/PartCard";
import AddPart from "../../AddPart";
import EditTicket from "../../EditTicket/EditTicket";
import TicketQR from "./TicketQR";
import TicketEmployees from "./TicketEmployees";

import './TicketDetails.scss';

export default function TicketDetails() {
    const dispatch = useDispatch();

    const [noteChecker, setNoteChecker] = useState(false);
    const [myWorkTickets, setMyWorkTickets] = useState(false);

    const [partsChecker, setPartsChecker] = useState(false);
    const [ticketChecker, setTicketChecker] = useState(false);

    const [deleteNoteChecker, setDeleteNoteChecker] = useState(false);
    const [deletePartChecker, setDeletePartChecker] = useState(false);

    const { ticketId } = useParams();

    const user = useSelector((state: any) => state.session.user);
    const status = useSelector((state: any) => state.status.allStatus);
    const notes = useSelector((state: any) => state.notes.allNotes);
    const ticket = useSelector((state: any) => state.tickets.ticket);
    const parts = useSelector((state: any) => state.parts.allParts);

    const [ticketStatus, setTicketStatus] = useState(ticket.id);

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
    }, [dispatch, ticketId, noteChecker, deleteNoteChecker, myWorkTickets, deletePartChecker, partsChecker, ticketChecker]);

    useEffect(() => {
        setNoteChecker(false)
    }, [noteChecker])

    useEffect(() => {
        setPartsChecker(false);
    }, [partsChecker])

    useEffect(() => {
        setMyWorkTickets(false);
    }, [myWorkTickets])

    if (!ticket || !status || !user || !notes || !parts) return <div className="ticket-details-tab"><span className="loader"></span></div>;

    const newStatus = status.filter((status: any) => status.id !== ticket.StatusInfo?.id);
    const notesForTicket = notes.filter((note: any) => note.ticketId === ticket.id);
    const partsForTicket = parts.filter((part: any) => part.Ticket?.id === ticket.id);

    const handleStatusChange = (e: any) => {
        dispatch(updateTicketThunk({ ...ticket, statusId: e.target.value, StatusInfo: status.find((status: any) => status.id === parseInt(e.target.value)) }) as any);
        setTicketStatus(e.target.value);
        setMyWorkTickets(true);
    }

    const onModalClose = () => {
        setNoteChecker(true);
        setDeleteNoteChecker(true);
    }

    const onModalCloseTickets = () => {
        setTicketChecker(true);
    }

    const onModalCloseParts = () => {
        setPartsChecker(true);
        setDeletePartChecker(true);
    }

    return (
        <section className="app-section ticket-details">
            <div className="section-header">
                <h1>
                    {ticket.title}

                    <span className="ticket-status" title={ticket.StatusInfo?.description} style={{ backgroundColor: ticket.StatusInfo?.color }}>
                        {ticket.StatusInfo?.name}
                    </span>
                </h1>

                {ticket.ClientInfo.companyName === "" ?
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
                }
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


        </section>
    );
}