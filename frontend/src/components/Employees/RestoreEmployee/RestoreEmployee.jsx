import { useDispatch } from 'react-redux';
import { useModal } from '../../../context/Modal';
import { activateUserThunk } from '../../../store/session';

import '../DeleteEmployee/DeleteEmployee.scss';

export default function RestoreEmployee({ employee, setDeleteEmployeeChecker }) {
    const dispatch = useDispatch();
    const { closeModal } = useModal();

    const handleRestore = (e) => {
        e.preventDefault();
        e.stopPropagation();

        return dispatch(activateUserThunk(employee))
            .then(() => {
                setDeleteEmployeeChecker(true);
                closeModal();
            });
    }

    return (
        <div className='confirm-delete-container'>
            <h1>Are you sure you want to restore this employee?</h1>
            <p>(All Tickets related to this employee will be restored as well)</p>
            <div className='confirm-delete-buttons'>
                <button onClick={(e) => handleRestore(e)}>Yes</button>
                <button onClick={closeModal}>No</button>
            </div>
        </div>
    )
}