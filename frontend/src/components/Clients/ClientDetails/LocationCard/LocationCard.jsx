// import { FaPen, FaAddressBook } from "react-icons/fa6";
import { TiContacts, TiEdit } from "react-icons/ti";

import { useEffect } from "react";

import OpenModalMenuItem from "../../../Navigation/OpenModalMenuItem";
import LocationContactInfo from "./LocationContactInfo";
import EditLocation from "./EditLocation";

import "./LocationCard.scss";

export default function LocationCard({ location, setLocationChecker, locationIndex, clientId }) {

    useEffect(() => {
        // This effect runs when setLocationChecker changes, can be used to trigger re-fetching location data if needed
    }, [setLocationChecker]);

    return (
        <div className="location-card">
            <div className="location-name">
                <div className="location-name-and-edit-location">
                    <h3>{location.name}</h3>
                    <div className="spacer">
                        <div className="location-contact-info-location">
                            <OpenModalMenuItem
                                modalComponent={<LocationContactInfo locationId={location.id} contactInfo={{ phoneNumbers: location.phoneNumbers, emails: location.emails }} />}
                                dismisable={true}
                            >
                                <TiContacts />
                            </OpenModalMenuItem>
                        </div>
                        <div className="edit-location-button-location">
                            <OpenModalMenuItem
                                modalComponent={<EditLocation locationIndex={locationIndex} setLocationChecker={setLocationChecker} clientId={clientId} />}
                                dismisable={true}
                            >
                                <TiEdit />
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