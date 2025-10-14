import { FaPen, FaPhone, FaEnvelope } from "react-icons/fa6";

import { formatPhoneNumber } from "../../../../utils/helperFunctions";

import OpenModalMenuItem from "../../../Navigation/OpenModalMenuItem";
import LocationContactInfo from "./LocationContactInfo";

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
                <OpenModalMenuItem
                    style={{ maxWidth: '400px' }}
                    modalComponent={<LocationContactInfo contactInfo={{ emails: location.emails, phoneNumbers: location.phoneNumbers }} />}
                    dismisable={true}
                >
                    <div className="see-contact-info-button">
                        <div>
                            Contact Information
                        </div>
                    </div>
                </OpenModalMenuItem>
            </div>
        </div>
    );
}