import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { MdOutlineLocalPhone } from "react-icons/md";
import { LuMail } from "react-icons/lu";

import { getUserThunk } from "../../../store/session";
import { getTicketsAssignedToEmployeeThunk } from "../../../store/tickets";
import { fetchUserRolesThunk } from "../../../store/session";

import { formatPhoneNumber } from "../../../utils/helperFunctions";

import TicketCard from "../../MyWork/MyWorkTicketCards";

import './EmployeeDetails.scss';


export default function EmployeeDetails() {
    const dispatch = useDispatch();

    const { employeeId } = useParams();

    const employee = useSelector(state => state.session.selectedUser)
    const tickets = useSelector(state => state.tickets.allTickets);
    const roles = useSelector(state => state.session.selectedUserRoles);

    useEffect(() => {
        dispatch(getUserThunk(employeeId));
        dispatch(getTicketsAssignedToEmployeeThunk(parseInt(employeeId)));
        dispatch(fetchUserRolesThunk(employeeId));
    }, [dispatch, employeeId]);

    console.log("Employee Details Employee:", employee);
    console.log("Employee Details Tickets:", tickets);
    console.log("Employee Details Roles:", roles);

    return (
        <div className="employee-details">
            {employee ? (
                <>
                    <div className="employee-header">
                        <h1>Employee Details</h1>
                        <div style={{ display: "flex", flexDirection: "row", width: "100%", justifyContent: "space-between", gap: "20px" }}>
                            <div className="employee-basic-info">
                                <div className="employee-profile-picture">
                                    {employee.profilePicUrl ? (
                                        <img src={employee.profilePicUrl} alt="Employee Profile" />
                                    ) : (
                                        <div className="placeholder-image">
                                            <span>{employee.firstName ? employee.firstName.charAt(0).toUpperCase() : ''}{employee.lastName ? employee.lastName.charAt(0).toUpperCase() : ''}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="divider"></div>
                                <div className="employee-basic-info-text">
                                    <div className="name-status">
                                        <h2>{employee.firstName} {employee.lastName}</h2>
                                        <span className={`status-badge-${employee.isActive ? 'active' : 'inactive'}`}>
                                            {employee.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    <div className="employee-username-role">
                                        <div>
                                            <span>Username:</span>
                                            <p>@{employee.username}</p>
                                        </div>
                                        <div>
                                            <span>Position:</span>
                                            <p>{employee.title}</p>
                                        </div>
                                    </div>
                                    <div className="employee-contact-information">
                                        <h3>Contact Information</h3>
                                        <div className="employee-contact-information-buttons">
                                            {employee.phone && (
                                                <div className="phone-number" onClick={() => {
                                                    window.location.href = `tel:${employee.phone}`;
                                                }}>
                                                    <div className="phone-button" >
                                                        <MdOutlineLocalPhone />
                                                    </div>
                                                    {formatPhoneNumber(employee.phone)}
                                                </div>
                                            )}
                                            {employee.email && (
                                                <div className="email-address" onClick={() => {
                                                    window.location.href = `mailto:${employee.email}`;
                                                }}>
                                                    <div className="email-button">
                                                        <LuMail />
                                                    </div>
                                                    {employee.email || "No email provided"}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="employee-roles">
                                <h3>Roles</h3>
                                {employee.title || "No role assigned"}
                            </div>
                        </div>
                    </div>
                    <div className="employee-tickets-container">
                        <h2>Assigned Tickets</h2>
                        <div className="client-tickets">
                            <div className="ticket-list">
                                {tickets && tickets.length > 0 ? (
                                    tickets.map(ticket => (
                                        <TicketCard key={ticket.id} ticket={ticket} />
                                    ))
                                ) : (
                                    <p className="no-tickets">No tickets available for this employee.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )
                : (<p>Loading...</p>)
            }
        </div >
    );
}