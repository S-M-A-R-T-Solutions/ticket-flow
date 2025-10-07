import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getPartThunk } from "../../../store/parts";

import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

import "./PartDetails.scss";

export default function PartDetails() {
    const dispatch = useDispatch();
    const { partId } = useParams();

    const part = useSelector((state) => state.parts.part);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        dispatch(getPartThunk(parseInt(partId)));
        setCurrentImageIndex(0);
    }, [dispatch, partId]);

    const handlePrevImage = (e) => {
        e.stopPropagation();
        if (!part?.images || part.images.length <= 1) return;
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? part.images.length - 1 : prevIndex - 1
        );
    };

    const handleNextImage = (e) => {
        e.stopPropagation();
        if (!part?.images || part.images.length <= 1) return;
        setCurrentImageIndex((prevIndex) =>
            prevIndex === part.images.length - 1 ? 0 : prevIndex + 1
        );
    };

    return (
        <div className="part-details">
            <h1>{part.name}</h1>
            {part ? (
                <div className="part-header">
                    <div className="part-info-left">
                        <div className="part-img-slider">
                            <button
                                className="left-arrow"
                                onClick={handlePrevImage}
                                disabled={!part.images || part.images.length <= 1}
                            >
                                <FaAngleLeft />
                            </button>

                            {part.images && part.images.length > 0 ? (
                                <img
                                    src={part.images[currentImageIndex]?.partImageURL}
                                    alt={`Part image ${currentImageIndex + 1}`}
                                />
                            ) : (
                                <img
                                    src="/assets/placeholder-image.jpg"
                                    alt="No image available"
                                />
                            )}

                            <button
                                className="right-arrow"
                                onClick={handleNextImage}
                                disabled={!part.images || part.images.length <= 1}
                            >
                                <FaAngleRight />
                            </button>
                        </div>
                    </div>

                    <div className="part-info-right">
                        <p><strong>SKU:</strong> {part.sku}</p>
                        <p><strong>Description:</strong> {part.description}</p>
                        <p><strong>Brand:</strong> {part.brand}</p>
                        <p><strong>Model:</strong> {part.model}</p>
                        <p><strong>Total Stock:</strong> {part.totalStock}</p>
                        <p><strong>Status:</strong> {part.active ? "Active" : "Inactive"}</p>
                    </div>
                </div>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}
