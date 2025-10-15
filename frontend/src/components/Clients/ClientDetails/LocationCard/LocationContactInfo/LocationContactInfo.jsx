import { FaPhone, FaEnvelope } from "react-icons/fa6";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    addPhoneNumberToALocationThunk,
    deletePhoneNumberFromALocationThunk,
    addEmailToALocationThunk,
    deleteEmailFromALocationThunk,
    getLocationThunk
} from "../../../../../store/clients";
import { tryFormatPhoneNumber, formatPhoneNumber } from "../../../../../utils/helperFunctions";
import "./LocationContactInfo.scss";

export default function LocationContactInfo({ locationId }) {
    const dispatch = useDispatch();

    const client = useSelector((state) => state.clients.client);
    const locations = client.locations || [];
    const location = locations.find((loc) => loc.id === locationId) || {};

    const phones = location?.phoneNumbers || [];
    const emails = location?.emails || [];

    // UI states
    const [showAddPhone, setShowAddPhone] = useState(false);
    const [showAddEmail, setShowAddEmail] = useState(false);

    useEffect(() => {
        dispatch(getLocationThunk(client.id, locationId));
    }, [dispatch, locationId, client.id]);

    // Form states
    const [phoneNumber, setPhoneNumber] = useState("");
    const [phoneType, setPhoneType] = useState("");
    const [email, setEmail] = useState("");
    const [emailType, setEmailType] = useState("");

    // Handlers
    const handleAddPhoneNumber = (e) => {
        e.preventDefault();
        if (!phoneNumber || !phoneType) return;

        dispatch(addPhoneNumberToALocationThunk(locationId, { phoneNumber, phoneType }));
        setPhoneNumber("");
        setPhoneType("");
        setShowAddPhone(false);
    };

    const handleDeletePhoneNumber = (phoneId) => {
        dispatch(deletePhoneNumberFromALocationThunk(phoneId));
    };

    const handleAddEmail = (e) => {
        e.preventDefault();
        if (!email || !emailType) return;

        dispatch(addEmailToALocationThunk({ locationId, email, emailType }));
        setEmail("");
        setEmailType("");
        setShowAddEmail(false);
    };

    const handleDeleteEmail = (emailId) => {
        dispatch(deleteEmailFromALocationThunk(emailId));
    };

    return (
        <div className="location-contact-info-wrapper">
            <h1>Contact Information</h1>

            <div className="contact-info-details">
                {/* Phone Section */}
                <div className="contact-phone-number-list">
                    <h3>Phone Numbers</h3>
                    {phones.length > 0 ? (
                        phones.map((phone) => (
                            <div key={phone.id} className="phone-number-element">
                                <div className="phone-section" onClick={() => (window.location.href = `tel:${phone.phoneNumber}`)}>
                                    <div className="phone-button">
                                        <FaPhone />
                                    </div>
                                    <div className="phone-number-and-title">
                                        <span className="phone-type-label">{phone.phoneType}</span>
                                        <span className="phone-number-label">{formatPhoneNumber(phone.phoneNumber)}</span>
                                    </div>
                                </div>
                                <button
                                    className="delete-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeletePhoneNumber(phone.id);
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No phone numbers yet.</p>
                    )}

                    {!showAddPhone ? (
                        <button className="add-button" onClick={() => setShowAddPhone(true)}>
                            + Add Phone Number
                        </button>
                    ) : (
                        <form className="add-phone-form" onSubmit={handleAddPhoneNumber}>
                            <input
                                type="text"
                                placeholder="Type (e.g., Mobile, Work)"
                                value={phoneType}
                                onChange={(e) => setPhoneType(e.target.value)}
                            />
                            <input
                                type="text"
                                name="phoneNumber"
                                placeholder="Phone Number"
                                maxLength={14}
                                value={tryFormatPhoneNumber(phoneNumber)}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                            />
                            <div className="form-actions">
                                <button type="submit">Add</button>
                                <button type="button" onClick={() => setShowAddPhone(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Email Section */}
                <div className="contact-email-list">
                    <h3>Email Addresses</h3>
                    {emails.length > 0 ? (
                        emails.map((emailObj) => (
                            <div key={emailObj.id} className="email-address-element">
                                <div className="email-section" onClick={() => (window.location.href = `mailto:${emailObj.email}`)}>
                                    <div className="email-button">
                                        <FaEnvelope />
                                    </div>
                                    <div className="email-address-and-title">
                                        <span className="email-type-label">{emailObj.emailType}</span>
                                        <span className="email-label">{emailObj.email}</span>
                                    </div>
                                </div>
                                <button
                                    className="delete-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteEmail(emailObj.id);
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>No email addresses yet.</p>
                    )}

                    {!showAddEmail ? (
                        <button className="add-button" onClick={() => setShowAddEmail(true)}>
                            + Add Email Address
                        </button>
                    ) : (
                        <form className="add-email-form" onSubmit={handleAddEmail}>
                            <input
                                type="text"
                                placeholder="Email Type (e.g., Work, Personal)"
                                value={emailType}
                                onChange={(e) => setEmailType(e.target.value)}
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <div className="form-actions">
                                <button type="submit">Add</button>
                                <button type="button" onClick={() => setShowAddEmail(false)}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
