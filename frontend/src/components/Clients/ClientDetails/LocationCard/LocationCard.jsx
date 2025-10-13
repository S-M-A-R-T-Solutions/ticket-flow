import { FaPen, FaPhone, FaEnvelope } from "react-icons/fa6";

import { formatPhoneNumber } from "../../../../utils/helperFunctions";

import "./LocationCard.scss";

export default function LocationCard({ location }) {
    return (
        <div className="location-card">
            <div className="location-name">
                <div className="location-name-and-edit">
                    <h3>{location.name}</h3>
                    <div className="edit-location-button">
                        <FaPen />
                    </div>
                </div>
            </div>
            <div className="location-address">
                <p>{location.addressLine1} {location.addressLine2 && `, ${location.addressLine2}`} {location.city}, {location.state} {location.zipcode}</p>
            </div>
            <div className="divider"></div>
            <div className="location-contact-info">
                <h4>Contact Information</h4>
                {(location.emails && location.emails.length > 0) || (location.phoneNumbers && location.phoneNumbers.length > 0) ? (
                    <div className="contact-info-details">
                        <div className="contact-phone-number-list">
                            {location.phoneNumbers && location.phoneNumbers.length > 0 ? (
                                location.phoneNumbers.map((phone, index) => (
                                    <div className="phone-number" key={index} onClick={() => {
                                        window.location.href = `tel:${phone.phoneNumber}`;
                                    }}>
                                        <div className="phone-button">
                                            <FaPhone />
                                        </div>
                                        <div className="phone-number-and-title">
                                            <span className="phone-type-label">{phone.phoneType}</span>
                                            <span className="phone-number-label">{formatPhoneNumber(phone.phoneNumber)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p></p>
                            )}
                        </div>
                        <div className="contact-email-list">
                            {location.emails && location.emails.length > 0 ? (
                                location.emails.map((email, index) => (
                                    <div className="email-address" key={index} onClick={() => {
                                        window.location.href = `mailto:${email.emailAddress}`;
                                    }}>
                                        <div className="email-button">
                                            <FaEnvelope />
                                        </div>
                                        <div className="email-address-and-title">
                                            <span className="email-type-label">{email.emailType}</span>
                                            <span className="email-label">{email.email}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p></p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="no-contact-info">No contact information available for this location.</p>
                )}
            </div>
        </div>
    );
}