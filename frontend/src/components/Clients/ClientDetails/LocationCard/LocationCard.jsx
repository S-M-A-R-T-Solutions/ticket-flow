import { FaPen, FaAddressBook } from "react-icons/fa6";

import OpenModalMenuItem from "../../../Navigation/OpenModalMenuItem";
import LocationContactInfo from "./LocationContactInfo";

import "./LocationCard.scss";

export default function LocationCard({ location }) {
    return (
        <div className="location-card">
            <div className="location-name">
                <div className="location-name-and-edit">
                    <h3>{location.name}</h3>
                    <div className="spacer">
                        <div className="location-contact-info">
                            <OpenModalMenuItem
                                modalComponent={<LocationContactInfo contactInfo={{ emails: location.emails, phoneNumbers: location.phoneNumbers }} />}
                                dismisable={true}
                            >
                                <FaAddressBook />
                            </OpenModalMenuItem>
                        </div>
                        <div className="edit-location-button">
                            <OpenModalMenuItem
                                modalComponent={<LocationContactInfo contactInfo={{ emails: location.emails, phoneNumbers: location.phoneNumbers }} />}
                                dismisable={true}
                            >
                                <FaPen />
                            </OpenModalMenuItem>
                        </div>
                    </div>
                </div>
            </div>
            <div className="location-address">
                <p>{location.addressLine1} {location.addressLine2 && `, ${location.addressLine2}`} {location.city}, {location.state} {location.zipcode}</p>
            </div>
            <div className="divider"></div>
        </div>
    );
}