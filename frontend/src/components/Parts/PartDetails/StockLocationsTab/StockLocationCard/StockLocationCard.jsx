import * as FaIcons from 'react-icons/fa';

import { FaPenToSquare } from "react-icons/fa6";

import "./StockLocationCard.scss";

export default function StockLocationCard({ location }) {

    const IconComponent = FaIcons[location.InventoryLocation.icon] || FaIcons.FaBoxOpen;

    console.log(IconComponent, "IconComponent");

    return (
        <div className="stock-location-card">
            <div className="location-card-left">
                <IconComponent className="location-icon" />
            </div>
            <div className="location-card-right">
                <div className="location-name">
                    {location.InventoryLocation.name}
                </div>
                <div className="location-quantity">
                    <h3>Quantity:</h3>
                    <p>{location.quantity}</p>
                </div>
            </div>
            <div className="manage-stock-button">
                <FaPenToSquare />
            </div>
        </div>
    );
}