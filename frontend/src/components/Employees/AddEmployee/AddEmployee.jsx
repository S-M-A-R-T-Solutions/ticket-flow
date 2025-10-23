import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addUserThunk } from '../../../store/session';
import { useModal } from '../../../context/Modal';

import './AddEmployee.scss';

export default function AddEmployee({ setEmployeesAddChecker }) {
    const dispatch = useDispatch();
    const { closeModal } = useModal();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profilePicUrl, setProfilePicUrl] = useState('/assets/placeholder-image.jpg');
    const [title, setTitle] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);

    const [errors, setErrors] = useState({});

    const updateFile = e => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const fileURL = URL.createObjectURL(file);
            setProfilePicUrl(fileURL);
            console.log(fileURL, "THIS IS THE FILE URL");
        }
    };

    return (
        <div className='add-user-container'>
            <div className='add-user-header'>
                <h1>Add Employee</h1>
            </div>
            <form className='add-user-form'>
                <div className='add-client-left'>
                    <div className="image-wrapper" onClick={() => document.getElementById('hiddenAddFileInput').click()}>
                        <img
                            src={profilePicUrl}
                            alt="client-avatar"
                            className="client-image"
                        />
                        <div className="image-overlay">Click to upload</div>
                    </div>
                    <input
                        id="hiddenAddFileInput"
                        type="file"
                        name="img_url"
                        capture="environment"
                        accept=".jpg, .jpeg, .png"
                        onChange={updateFile}
                        style={{ display: 'none' }}
                    />
                    {errors.profilePicUrl && <span className="error">{errors.profilePicUrl}</span>}
                </div>
                <div className='add-user-right'>
                    <div className='first-last-name'>
                        <div className='add-client-input'>
                            <label>First Name</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                            {errors.firstName && <span className="error">{errors.firstName}</span>}
                        </div>
                        <div className='add-client-input'>
                            <label>Last Name</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                            {errors.lastName && <span className="error">{errors.lastName}</span>}
                        </div>
                    </div>
                    
                </div>
            </form>
        </div>
    );
}