import { addLocationToAClientThunk } from "../../../../store/clients";
import { useModal } from '../../../../context/Modal';

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";

import './AddLocation.scss';

export default function AddLocation({ setLocationAddedChecker, clientId }) {
    const dispatch = useDispatch();

    const [name, setName] = useState("");
    const [addressLine1, setAddressLine1] = useState("");
    const [addressLine2, setAddressLine2] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipcode, setZipcode] = useState("");
    const [errors, setErrors] = useState({});
    const [disabled, setDisabled] = useState(true);

    useEffect(() => {
        setDisabled(Object.keys(errors).length > 0);
    }, [errors]);

    useEffect(() => {
        let newErrors = {};

        if (!name || name === '') {
            newErrors.name = "Please enter a valid location name";
        }

        if (!addressLine1 || addressLine1 === '') {
            newErrors.addressLine1 = "Please enter a valid address line 1";
        }

        if (!city || city === '') {
            newErrors.city = "Please enter a valid city";
        }

        if (!state || state === '') {
            newErrors.state = "Please enter a valid state";
        }

        if (!zipcode || zipcode === '' || !/^\d{5}(-\d{4})?$/.test(zipcode)) {
            newErrors.zipcode = "Please enter a valid zipcode";
        }

        setErrors(newErrors);
    }, [name, addressLine1, city, state, zipcode]);

    const { closeModal } = useModal();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Logic to submit the new location to the backend would go here
        // After successful submission, you might want to call setLocationAddedChecker(true);
        const newLocation = {
            name,
            addressLine1,
            addressLine2,
            city,
            state,
            zipcode
        };
        await dispatch(addLocationToAClientThunk(clientId, newLocation));
        setLocationAddedChecker(true);
        closeModal();
    }

    return (
        <div className="add-location-form">
            <h2>Add New Location</h2>
            <div className="form-group">
                <form onSubmit={handleSubmit}>
                    <div className="add-location-input">
                        <label>Location Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Location Name"
                        />
                        {errors.name && <div className="error-message">{errors.name}</div>}
                    </div>
                    <div className="address-lines">
                        <div className="add-location-input">
                            <label>Address Line 1</label>
                            <input
                                type="text"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                required
                                placeholder="Address Line 1"
                            />
                            {errors.addressLine1 && <div className="error-message">{errors.addressLine1}</div>}
                        </div>
                        <div className="add-location-input">
                            <label>Address Line 2</label>
                            <input
                                type="text"
                                value={addressLine2}
                                onChange={(e) => setAddressLine2(e.target.value)}
                                placeholder="(Optional)"
                            />
                        </div>
                    </div>
                    <div className="city-state-zip">
                        <div className="add-location-input">
                            <label>City</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                required
                                placeholder="City"
                            />
                            {errors.city && <div className="error-message">{errors.city}</div>}
                        </div>
                        <div className="add-location-input">
                            <label>State</label>
                            <select
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                required
                            >
                                <option value="AL">Alabama</option>
                                <option value="AK">Alaska</option>
                                <option value="AZ">Arizona</option>
                                <option value="AR">Arkansas</option>
                                <option value="CA">California</option>
                                <option value="CO">Colorado</option>
                                <option value="CT">Connecticut</option>
                                <option value="DE">Delaware</option>
                                <option value="FL">Florida</option>
                                <option value="GA">Georgia</option>
                                <option value="HI">Hawaii</option>
                                <option value="ID">Idaho</option>
                                <option value="IL">Illinois</option>
                                <option value="IN">Indiana</option>
                                <option value="IA">Iowa</option>
                                <option value="KS">Kansas</option>
                                <option value="KY">Kentucky</option>
                                <option value="LA">Louisiana</option>
                                <option value="ME">Maine</option>
                                <option value="MD">Maryland</option>
                                <option value="MA">Massachusetts</option>
                                <option value="MI">Michigan</option>
                                <option value="MN">Minnesota</option>
                                <option value="MS">Mississippi</option>
                                <option value="MO">Missouri</option>
                                <option value="MT">Montana</option>
                                <option value="NE">Nebraska</option>
                                <option value="NV">Nevada</option>
                                <option value="NH">New Hampshire</option>
                                <option value="NJ">New Jersey</option>
                                <option value="NM">New Mexico</option>
                                <option value="NY">New York</option>
                                <option value="NC">North Carolina</option>
                                <option value="ND">North Dakota</option>
                                <option value="OH">Ohio</option>
                                <option value="OK">Oklahoma</option>
                                <option value="OR">Oregon</option>
                                <option value="PA">Pennsylvania</option>
                                <option value="RI">Rhode Island</option>
                                <option value="SC">South Carolina</option>
                                <option value="SD">South Dakota</option>
                                <option value="TN">Tennessee</option>
                                <option value="TX">Texas</option>
                                <option value="UT">Utah</option>
                                <option value="VT">Vermont</option>
                                <option value="VA">Virginia</option>
                                <option value="WA">Washington</option>
                                <option value="WV">West Virginia</option>
                                <option value="WI">Wisconsin</option>
                                <option value="WY">Wyoming</option>
                            </select>
                            {/* {errors.state && <div className="error-message">{errors.state}</div>} */}
                        </div>
                        <div className="add-location-input">
                            <label>Zipcode</label>
                            <input
                                type="text"
                                placeholder="12345 or 12345-6789"
                                value={zipcode}
                                onChange={(e) => setZipcode(e.target.value)}
                                required
                            />
                            {errors.zipcode && <div className="error-message">{errors.zipcode}</div>}
                        </div>
                    </div>
                    <div className="form-buttons">
                        <button type="submit" className="submit-button" disabled={disabled}>Add Location</button>
                        <button type="button" className="cancel-button" onClick={() => { setLocationAddedChecker(false); closeModal(); }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}