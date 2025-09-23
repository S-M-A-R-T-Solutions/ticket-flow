import { NavLink } from 'react-router-dom';
import { FaHome, FaTicketAlt } from "react-icons/fa";
import { FaUsers, FaBoxArchive } from "react-icons/fa6";

import { MdHome, MdConfirmationNumber, MdGroup, MdInventory } from "react-icons/md";

import './SideBar.scss';

export default function SideBar() {
    return (
        <nav className="sidebar">
            <ul className="nav-list">
                <li>
                    <NavLink to="/dashboard" className="menu-item">
                        <MdHome />
                        Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/tickets" className="menu-item">
                        <MdConfirmationNumber />
                        Tickets
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/clients" className="menu-item">
                        <MdGroup />
                        Clients
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/inventory" className="menu-item">
                        <MdInventory />
                        Inventory
                    </NavLink>
                </li>
            </ul>
        </nav >
    );
}