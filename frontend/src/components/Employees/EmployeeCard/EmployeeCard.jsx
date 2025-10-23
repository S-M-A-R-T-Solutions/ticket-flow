import { TiEdit } from "react-icons/ti";
import { IoTrashOutline } from "react-icons/io5";

import OpenModalMenuItem from "../../Navigation/OpenModalMenuItem";

import EditEmployee from "../EditEmployee/EditEmployee";

import './EmployeeCard.scss';

export default function EmployeeCard({ employee, setEditEmployeeChecker }) {
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
                <div className="edit-employee-btn">
                    <OpenModalMenuItem
                        modalComponent={<EditEmployee employee={employee} setEditEmployeeChecker={setEditEmployeeChecker} />}
                    >
                        <TiEdit />
                    </OpenModalMenuItem>
                </div>
                <div className="delete-employee-btn">
                    <OpenModalMenuItem
                        modalComponent={<EditEmployee employee={employee} setEditEmployeeChecker={setEditEmployeeChecker} />}
                    >
                        <IoTrashOutline style={{ color: "var(--danger-color, #c33)", fontSize: "18px" }} />
                    </OpenModalMenuItem>
                </div>
            </div>
        </div>
    );
}