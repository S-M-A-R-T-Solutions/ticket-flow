import { NavLink } from 'react-router-dom';
import { MdHome, MdConfirmationNumber, MdGroup, MdInventory } from "react-icons/md";

import './SideBar.scss';

export default function SideBar() {
    return (
        <nav className="sidebar">
            <NavLink to="/" className="brand">
                <img src="/assets/logo-tf.png" className='logo-main' alt='logo'></img>
                <span className="title">ticketFlow</span>
            </NavLink>

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