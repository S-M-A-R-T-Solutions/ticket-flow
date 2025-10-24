import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { TiEdit } from "react-icons/ti";
import { MdOutlineCancel, MdCheckCircleOutline } from "react-icons/md"

import OpenModalMenuItem from "../../Navigation/OpenModalMenuItem";

import EditEmployee from "../EditEmployee";
import DeleteEmployee from '../DeleteEmployee';
import RestoreEmployee from '../RestoreEmployee';

import { restoreUser } from "../../../store/session";

import './EmployeeCard.scss';

export default function EmployeeCard({ employee, isActive, setEditEmployeeChecker, setDeleteEmployeeChecker }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const sessionUser = useSelector((state) => state.session.user);

    useEffect(() => {
        dispatch(restoreUser());
    }, [dispatch]);

    const goToEmployeeDetails = () => {
        navigate(`/employees/${employee.id}`);
    };

    if(!sessionUser) return (
        <div>Loading...</div>
    )

    return (
        <div
            className={`employee-card-${isActive ? 'inactive' : 'active'}`}
            style={{ opacity: employee.active ? 0.5 : 1 }}
        >
            <div className='employee-left'
                onClick={goToEmployeeDetails}
                style={{ cursor: "pointer" }}
            >
                <img className="employee-profile-picture" src={employee.profilePicUrl} alt="profile-pic" />
                <div className="employee-info">
                    <h3>{employee.firstName} {employee.lastName}</h3>
                    <p className="employee-username">@{employee.username}</p>
                </div>
            </div>
            <div className='employee-operations' style={{ display: employee.isActive ? 'flex' : 'none' }}>
                <div className="edit-employee-btn">
                    <OpenModalMenuItem
                        modalComponent={<EditEmployee employee={employee} setEditEmployeeChecker={setEditEmployeeChecker} />}
                    >
                        <TiEdit />
                    </OpenModalMenuItem>
                </div>
                <div className="active-employee-btn" style={{ display: (sessionUser.id === employee.id) || employee.active ? 'none' : 'block' }}>
                    <OpenModalMenuItem
                        modalComponent={<DeleteEmployee employee={employee} setDeleteEmployeeChecker={setDeleteEmployeeChecker} />}
                    >
                        <MdOutlineCancel style={{ color: "var(--danger-color, #c33)", fontSize: "18px" }} />
                    </OpenModalMenuItem>
                </div>
            </div>
            <div className="employee-operations-inactive" style={{ display: employee.isActive ? 'none' : 'flex' }}>
                <div className="inactive-employee-btn">
                    <OpenModalMenuItem
                        modalComponent={<RestoreEmployee employee={employee} setDeleteEmployeeChecker={setDeleteEmployeeChecker} />}
                    >
                        <MdCheckCircleOutline style={{ color: "var(--success-color, #4BB543)", fontSize: "20px" }} />
                    </OpenModalMenuItem>
                </div>
            </div>
        </div>
    );
}