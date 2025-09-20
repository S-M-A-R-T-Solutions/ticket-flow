import { useState } from "react";

import { FaCirclePlus } from 'react-icons/fa6';

import OpenModalMenuItem from '../Navigation/OpenModalMenuItem';
import AddClient from '../AddClient';

import './Inventory.css';

export default function Inventory() {
    const [checker, setChecker] = useState(false);

    const onModalClose = () => {
        setChecker(true);
    }

    return (
        <section className="inventory-tab">
            <div className="tickets-header">
                <h1>Inventory</h1>

                <div className='add-ticket-btn' style={{ listStyle: "none", display: "flex", flexDirection: "row", gap: "5px" }}>
                    <FaCirclePlus />
                    <OpenModalMenuItem
                        itemText={"Add Part"}
                        modalComponent={<AddClient setClientsChecker={setChecker} />}
                        onModalClose={onModalClose}
                    />
                </div>
            </div>

            <div className="inventory-container">

            </div>

            <div className="inventory-footer">

            </div>
        </section>
    );
}