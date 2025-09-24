import { NavLink } from 'react-router-dom';
import { MdOutlineInventory } from "react-icons/md";
import { AiOutlineHome } from "react-icons/ai";
import { LuTicket } from "react-icons/lu";
import { HiOutlineUserGroup } from "react-icons/hi";



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
                    <NavLink to="/dashboard" className="nav-item">
                        <AiOutlineHome className='nav-icon' mode="outlined" />
                        Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/tickets" className="nav-item">
                        <LuTicket className='nav-icon' />
                        Tickets
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/clients" className="nav-item">
                        <HiOutlineUserGroup className='nav-icon' />
                        Clients
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/inventory" className="nav-item">
                        <MdOutlineInventory className='nav-icon' />
                        Inventory
                    </NavLink>
                </li>
            </ul>
        </nav >
    );
}