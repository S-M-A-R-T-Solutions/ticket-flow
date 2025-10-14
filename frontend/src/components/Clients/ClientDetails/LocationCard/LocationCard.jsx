import { FaPen, FaAddressBook } from "react-icons/fa6";

import { useState, useEffect } from "react";

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
                <div className="location-name-and-edit">
                    <h3>{location.name}</h3>
                    <div className="spacer">
                        <div className="location-contact-info">
                            <OpenModalMenuItem
                                modalComponent={<LocationContactInfo contactInfo={{ phoneNumbers: location.phoneNumbers, emails: location.emails }} />}
                                dismisable={true}
                            >
                                <FaAddressBook />
                            </OpenModalMenuItem>
                        </div>
                        <div className="edit-location-button">
                            <OpenModalMenuItem
                                modalComponent={<EditLocation locationIndex={locationIndex} setLocationChecker={setLocationChecker} clientId={clientId} />}
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