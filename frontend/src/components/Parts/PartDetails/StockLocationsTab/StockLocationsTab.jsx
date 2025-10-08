import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";

import { getAllStockPerLocationThunk } from "../../../../store/stockLocations";

import StockLocationCard from "./StockLocationCard";

import "./StockLocationsTab.scss";

export default function StockLocationsTab({ partId }) {
    const dispatch = useDispatch();

    const stockLocations = useSelector((state) => state.stockLocations.stockLocations);

    useEffect(() => {
        dispatch(getAllStockPerLocationThunk(partId));
    }, [dispatch, partId]);

    if (!stockLocations)
        return (
            <section className="stock-locations-tab">
                <span className="loader"></span>
            </section>
        );

    console.log(stockLocations, "stockLocations");

    return (
        <div className="stock-locations-wrapper">
            {stockLocations.length === 0 ? (
                <div className="no-stock-locations">
                    No stock locations available.
                </div>
            ) : (
                stockLocations.map((location) => (
                    <div key={location.id}>
                        <StockLocationCard location={location} />
                    </div>
                ))
            )}
        </div>
    );
}