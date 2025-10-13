import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import LocationCard from "./LocationCard";

import { getOneClientThunk } from "../../../store/clients";

import { FaPhone, FaEnvelope, FaPen, FaCirclePlus } from "react-icons/fa6";

import { formatPhoneNumber } from "../../../utils/helperFunctions";

import './ClientDetails.scss';
import ClientTickets from "./ClientTickets/ClientTickets";

export default function ClientDetails() {
    const dispatch = useDispatch();

    const { clientId } = useParams();

    const client = useSelector(state => state.clients.client)

    useEffect(() => {
        dispatch(getOneClientThunk(clientId));
    }, [dispatch, clientId]);

    console.log("CLIENT DETAILS CLIENT: ", client);

    return (
        <div className="client-details">
            {client ? (
                <>
                    <div className="client-details-header">
                        <div className="client-title">
                            <div className="client-image">
                                {client.profilePicUrl ? (
                                    <img src={client.profilePicUrl} alt="Client Profile" />
                                ) : (
                                    <div className="placeholder-image">
                                        <span>{client.firstName ? client.firstName.charAt(0).toUpperCase() : ''}{client.lastName ? client.lastName.charAt(0).toUpperCase() : ''}</span>
                                    </div>
                                )}
                            </div>
                            {client.companyName ? (
                                <div className="title-and-company">
                                    <h1>{client.companyName}</h1>
                                    <div className="company-tag">
                                        COMPANY
                                    </div>
                                </div>
                            ) : (
                                <div className="title-and-company">
                                    <h1>{client.firstName} {client.lastName}</h1>
                                    <div className="individual-tag">
                                        INDIVIDUAL
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="edit-client-button">
                            <FaPen />
                        </div>
                    </div>
                    <div className="client-details-body">
                        <div className="client-details-info">
                            <h2>Contact Information</h2>
                            {client.phone && (
                                <div className="phone-number" onClick={() => {
                                    window.location.href = `tel:${client.phone}`;
                                }}>
                                    <div className="phone-button">
                                        <FaPhone />
                                    </div>
                                    {formatPhoneNumber(client.phone)}
                                </div>
                            )}
                            {client.email && (
                                <div className="email-address" onClick={() => {
                                    window.location.href = `mailto:${client.email}`;
                                }}>
                                    <div className="email-button">
                                        <FaEnvelope />
                                    </div>
                                    {client.email || "No email provided"}
                                </div>
                            )}
                        </div>
                        {/* TODO: Add additional client details here (LOCATIONS INFO, and TICKETS RELATED TO THIS CLIENT*/}
                        <div className="locations-section">
                            <div className="locations-header">
                                <h2>Locations</h2>
                                <div className="add-location-button">
                                    <FaCirclePlus /> 
                                    <div>
                                        Add Location
                                    </div>
                                </div>
                            </div>
                            <div className="locations-list">
                                {client.locations && client.locations.length > 0 ? (
                                    client.locations.map(location => (
                                        <LocationCard key={location.id} location={location} />
                                    ))
                                ) : (
                                    <p>No locations available for this client.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="client-tickets-section">
                        <ClientTickets tickets={client.tickets} />
                    </div>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}