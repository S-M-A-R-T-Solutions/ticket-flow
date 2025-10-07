import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getPartThunk } from "../../../store/parts";

import './PartDetails.scss'

export default function PartDetails() {
    const dispatch = useDispatch();

    const { partId } = useParams();

    const part = useSelector((state) => state.parts.part);

    useEffect(() => {
        dispatch(getPartThunk(parseInt(partId)));
    }, [dispatch, partId]);

    return (
        <div className="part-details">
            <h1>Part Details</h1>
            {part ? (
                <div>
                    <h2>{part.name}</h2>
                    <p>{part.description}</p>
                    <p>Brand: {part.brand}</p>
                    <p>Model: {part.model}</p>
                    <p>Unit: {part.unit}</p>
                    <p>Price: ${part.defaultPrice}</p>
                    <p>Status: {part.active ? "Active" : "Inactive"}</p>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}