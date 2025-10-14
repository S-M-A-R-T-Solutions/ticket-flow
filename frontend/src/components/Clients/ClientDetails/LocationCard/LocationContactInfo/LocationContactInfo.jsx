import { FaPhone, FaEnvelope } from "react-icons/fa6";

import { formatPhoneNumber } from "../../../../../utils/helperFunctions";

import "./LocationContactInfo.scss";

export default function LocationContactInfo({ contactInfo }) {

    const phones = contactInfo?.phoneNumbers;
    const emails = contactInfo?.emails;

    return (
        <div className="location-contact-info-wrapper">
            <h1>Contact Information</h1>
            {(emails && emails.length > 0) || (phones && phones.length > 0) ? (
                <div className="contact-info-details">
                    <div className="contact-phone-number-list">
                        {phones && phones.length > 0 ? (
                            phones.map((phone, index) => (
                                <div className="phone-number-element" key={index} onClick={() => {
                                    window.location.href = `tel:${phone.phoneNumber}`;
                                }}>
                                    <div className="phone-section">
                                        <div className="phone-button">
                                            <FaPhone />
                                        </div>
                                        <div className="phone-number-and-title">
                                            <span className="phone-type-label">{phone.phoneType}</span>
                                            <span className="phone-number-label">{formatPhoneNumber(phone.phoneNumber)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No Phone Numbers</p>
                        )}
                    </div>
                    <div className="contact-email-list">
                        {emails && emails.length > 0 ? (
                            emails.map((email, index) => (
                                <div className="email-address-element" key={index} onClick={() => {
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
                            <p>No Email Adresses</p>
                        )}
                    </div>
                </div>
            ) : (
                <p className="no-contact-info">No contact information available for this location.</p>
            )}
        </div>
    )
}