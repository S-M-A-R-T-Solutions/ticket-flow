import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";

import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
import { FaCirclePlus } from "react-icons/fa6";

import OpenModalMenuItem from "../Navigation/OpenModalMenuItem";

import './Inventory.css';

import { getAllPartsThunk, getTotalPartsAmountThunk } from "../../store/parts";
import PartCard from "../Parts/PartCard/PartCard";
import AddPart from "../AddPart";
import { getAllStatusThunk } from "../../store/status";

export default function Inventory() {
    const dispatch = useDispatch();

    const allParts = useSelector((state) => state.parts.allParts);
    const totalParts = useSelector((state) => state.parts.totalPartsAmount);

    const [page, setPage] = useState(1);
    const [deletePartCkecker, setDeletePartChecker] = useState(false);
    const [addPartCkecker, setAddPartChecker] = useState(false);
    const [editPartCkecker, setEditPartChecker] = useState(false);

    const PARTS_PER_PAGE = 10;

    useEffect(() => {
        dispatch(getTotalPartsAmountThunk());
        dispatch(getAllPartsThunk(page, PARTS_PER_PAGE));
        dispatch(getAllStatusThunk());
        setDeletePartChecker(false);
        setAddPartChecker(false);
        setEditPartChecker(false);
    }, [dispatch, page, addPartCkecker, deletePartCkecker, editPartCkecker]);

    console.log(totalParts, "totalParts");

    const lastPage = Math.ceil(totalParts / PARTS_PER_PAGE);

    // if (!allParts || !totalParts)
    if (!allParts)
        return (
            <section className="inventory-tab">
                <span className="loader"></span>
            </section>
        );

    const onModalClose = () => {
        setDeletePartChecker(true);
        setAddPartChecker(true);
        setEditPartChecker(true);
    }

    return (
        <section className="app-section inventory-tab">
            <div className="section-header">
                <h1>Inventory</h1>

                <div className="spacer"></div>

                <div className='add-ticket-btn' style={{ listStyle: "none", display: "flex", flexDirection: "row", gap: "5px" }}>
                    <FaCirclePlus />
                    <OpenModalMenuItem
                        itemText={"Add Part"}
                        modalComponent={<AddPart setPartsChecker={setAddPartChecker} />}
                        onModalClose={onModalClose}
                        dismisable={false}
                    />
                </div>
            </div>

            <div className="inventory-container">
                {allParts.map((part) => (
                    <PartCard key={part.id} part={part} setEditPartChecker={setEditPartChecker} setDeletePartChecker={setEditPartChecker} />
                ))}
            </div>

            <div className="tickets-footer">
                <button className='prev-btn' style={{ border: "none" }} disabled={page <= 1} onClick={() => setPage(page - 1)}><FaAngleLeft /></button>
                <div>
                    <span >
                        {page} of {lastPage}
                    </span>
                </div>
                <button className='next-btn' style={{ border: "none" }} disabled={page >= lastPage} onClick={() => setPage(page + 1)}><FaAngleRight /></button>
            </div>
        </section>
    );
}