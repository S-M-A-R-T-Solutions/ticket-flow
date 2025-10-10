import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { useParams } from "react-router-dom";

import { getOneClientThunk } from "../../../store/clients";

import { FaPhone, FaEnvelope } from "react-icons/fa6";

import { formatPhoneNumber } from "../../../utils/helperFunctions";

import './ClientDetails.scss';

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
                    </div>
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
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}