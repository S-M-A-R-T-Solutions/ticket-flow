import { TiEdit } from "react-icons/ti";
import { IoTrashOutline } from "react-icons/io5";

import './EmployeeCard.scss';

export default function EmployeeCard({ employee }) {
    return (
        <div className="employee-card">
            <div className='employee-left'>
                <img className="employee-profile-picture" src={employee.profilePicUrl} alt="profile-pic" />
                <div className="employee-info">
                    <h3>{employee.firstName} {employee.lastName}</h3>
                    <p className="employee-username">@{employee.username}</p>
                </div>
            </div>
            <div className='employee-operations'>
                <button className='edit-employee-btn'>
                    <TiEdit />
                </button>
                <button className='delete-employee-btn'>
                    <IoTrashOutline />
                </button>
            </div>
        </div>
    );
}