import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getPartThunk } from "../../../store/parts";

import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";

import "./PartDetails.scss";
import StockLocationsTab from "./StockLocationsTab/StockLocationsTab";

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
            {part ? (
                <>
                    <div className="part-header">
                        <div className="part-info-right">
                            <div className="part-title">
                                <div className="title-and-status">
                                    <h1>{part.name}</h1>
                                    <div className={`part-status-chip-${part.active ? "active" : "inactive"}`}>
                                        <p>{part.active ? "Active" : "Inactive"}</p>
                                    </div>
                                </div>
                                <div className="sku-chip">
                                    <p>SKU: {part.sku}</p>
                                </div>
                            </div>
                            <div className="part-description">
                                <h3 className="description-title">
                                    Description:
                                </h3>
                                <p>{part.description}</p>
                            </div>
                            <div className="brand-model-container">
                                <div className="brand-container">
                                    <h3 className="description-title">
                                        Brand:
                                    </h3>
                                    <p>{part.brand}</p>
                                </div>
                                <div className="model-container">
                                    <h3 className="description-title">
                                        Model:
                                    </h3>
                                    <p>{part.model}</p>
                                </div>
                            </div>
                            <div className="price-container">
                                <h3 className="description-title">
                                    Regular Price:
                                </h3>
                                <p>{part.defaultPrice ? `$${part.defaultPrice.toFixed(2)}` : "N/A"}</p>
                            </div>
                        </div>
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
                    </div>
                    <div className="part-stock-details">
                        <h2>Stock Details</h2>
                        <StockLocationsTab partId={part.id} />
                    </div>
                </>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );
}
