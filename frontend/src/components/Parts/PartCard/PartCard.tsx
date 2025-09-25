import { FaPen, FaTrash } from "react-icons/fa";
import { PiImageSquare } from "react-icons/pi";

import { useSelector } from "react-redux"

// import { useState, useEffect } from "react";

import OpenModalMenuItem from "../../Navigation/OpenModalMenuItem";
import EditPart from "../../EditPart/EditPart";


import "./PartCard.scss";

interface PartCardProps {
    part: any;
    setDeletePartChecker: any;
    ticketAuthor: any;
    setPartsChecker: any;
}

export default function PartCard({
    part,
    setDeletePartChecker,
    ticketAuthor,
    setPartsChecker
}: PartCardProps) {
    const currentUser = useSelector((state: any) => state.session.user);

    const onModalClose = () => {
        setPartsChecker(true);
        setDeletePartChecker(true);
    }

    return (
        <div className="part-card">
            <div className="image">
                {part.imageUrl ?
                    // {false ?
                    <img src={part.imageUrl} alt={part.name + " image"} /> :
                    <PiImageSquare className="part-icon" />
                }

            </div>

            <div className="part-info">
                <div className="part-name">{part.name}</div>
                <div className="part-description">{part.description}</div>

                <div className="spacer"></div>

                <div className="part-footer">
                    <div className="part-sku">
                        {part.sku || "N/A"}
                    </div>

                    <div className="part-total-stock">{
                        part.totalStock ?
                            // true ?
                            <><strong>{part.totalStock || 187}</strong> In Stock</> :
                            <em>Out of Stock</em>
                    }</div>
                </div>
            </div>
        </div>
    );
}