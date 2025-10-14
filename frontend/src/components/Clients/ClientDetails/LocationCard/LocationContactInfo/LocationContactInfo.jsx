import { FaPhone, FaEnvelope } from "react-icons/fa6";

import { formatPhoneNumber } from "../../../../../utils/helperFunctions";

import "./LocationContactInfo.scss";

export default function LocationContactInfo({ contactInfo }) {
    return (
        <div className="location-contact-info">
            <h4>Contact Information</h4>
            {(contactInfo.emails && contactInfo.emails.length > 0) || (contactInfo.phoneNumbers && contactInfo.phoneNumbers.length > 0) ? (
                <div className="contact-info-details">
                    <div className="contact-phone-number-list">
                        {contactInfo.phoneNumbers && contactInfo.phoneNumbers.length > 0 ? (
                            contactInfo.phoneNumbers.map((phone, index) => (
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
                        {contactInfo.emails && contactInfo.emails.length > 0 ? (
                            contactInfo.emails.map((email, index) => (
                                <div className="email-address" key={index} onClick={() => {
                                    window.location.href = `mailto:${email.email}`;
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
    )
}