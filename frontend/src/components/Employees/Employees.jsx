import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";

import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

import { getAllUsersThunk, getTotalUsersAmountThunk } from "../../store/session";

import OpenModalMenuItem from "../Navigation/OpenModalMenuItem";

import { LuUserPlus } from "react-icons/lu";

import "./Employees.scss";

export default function Employees() {
    const dispatch = useDispatch();

    const [page, setPage] = useState(1);

    const EMPLOYEES_PER_PAGE = 10;

    const employees = useSelector((state) => state.session.allUsers);
    const totalEmployees = useSelector((state) => state.session.totalUsersAmount);
    const lastPage = Math.ceil(totalEmployees / EMPLOYEES_PER_PAGE);

    useEffect(() => {
        dispatch(getTotalUsersAmountThunk());
        dispatch(getAllUsersThunk(page, EMPLOYEES_PER_PAGE));
    }, [dispatch, page]);

    return (
        <section className="employees-tab">
            <div className="employees-section-header">
                    <h1>Employees</h1>
                    <OpenModalMenuItem
                    >
                        <button className="add-employee-btn">
                            <LuUserPlus /> Add Employee
                        </button>
                    </OpenModalMenuItem>
            </div>

            <div className="employees-list">
                {employees && Object.values(employees).map((employee) => (
                    <div key={employee.id} className="employee-card">
                        <h2>{employee.firstName} {employee.lastName}</h2>
                        <p>Email: {employee.email}</p>
                        <p>Role: {employee.role}</p>
                    </div>
                ))}
            </div>

            <div className='employees-footer'>
                <button className='prev-btn' style={{ border: "none" }} disabled={page <= 1} onClick={() => setPage(page - 1)}><HiOutlineChevronLeft /></button>
                <div>
                    <span >
                        {page} of {lastPage}
                    </span>
                </div>
                <button className='next-btn' style={{ border: "none" }} disabled={page >= lastPage} onClick={() => setPage(page + 1)}><HiOutlineChevronRight /></button>
            </div>

        </section>
    );
}