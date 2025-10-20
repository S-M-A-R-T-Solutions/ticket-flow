import { useSelector, useDispatch } from "react-redux"
import { useState, useEffect } from "react"
import { useModal } from "../../../../../context/Modal";

import { editLocationThunk } from "../../../../../store/clients";

import { STATES } from "../../../../../utils/constants";

import './EditLocation.scss';

export default function EditLocation({ setLocationChecker, locationIndex, clientId }) {
    const dispatch = useDispatch();
    const { closeModal } = useModal();
    const location = useSelector(state => state.clients.client.locations[locationIndex]);

    const [name, setName] = useState(location.name);
    const [addressLine1, setAddressLine1] = useState(location.addressLine1);
    const [addressLine2, setAddressLine2] = useState(location.addressLine2);
    const [city, setCity] = useState(location.city);
    const [state, setState] = useState(location.state);
    const [zipcode, setZipcode] = useState(location.zipcode);
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

    console.log(locationIndex, "LOCATION INDEX IN EDIT LOCATION")

    const handleSubmit = (e) => {
        e.preventDefault();

        const updatedLocation = {
            id: location.id,
            name,
            addressLine1,
            addressLine2,
            city,
            state,
            zipcode
        };

        dispatch(editLocationThunk(clientId, location.id, updatedLocation))
            .then(() => {
                setLocationChecker(true);
                closeModal();
            })
            .catch(async (res) => {
                const data = await res.json();
                if (data && data.errors) {
                    setErrors(data.errors);
                }
            });
    }

    return (
        <div className="edit-location-modal">
            <h1>Edit Location</h1>
            <div className="form-group">
                <form onSubmit={handleSubmit}>
                    <div className="edit-location-input">
                        <label>Location Name*</label>
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
                        <div className="edit-location-input">
                            <label>Address Line 1*</label>
                            <input
                                type="text"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                required
                                placeholder="Address Line 1"
                            />
                            {errors.addressLine1 && <div className="error-message">{errors.addressLine1}</div>}
                        </div>
                        <div className="edit-location-input">
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
                        <div className="edit-location-input">
                            <label>City*</label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                required
                                placeholder="City"
                            />
                            {errors.city && <div className="error-message">{errors.city}</div>}
                        </div>
                        <div className="edit-location-input">
                            <label>State*</label>
                            <select
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                                required
                            >
                                {STATES.map((state) => (
                                    <option key={state.abbreviation} value={state.abbreviation}>
                                        {state.name}
                                    </option>
                                ))}
                            </select>
                            {/* {errors.state && <div className="error-message">{errors.state}</div>} */}
                        </div>
                        <div className="edit-location-input">
                            <label>Zipcode*</label>
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
                        <button className="submit-button-btn-edit-location" disabled={disabled}>Save Changes</button>
                        <button className="cancel-button-btn-edit-location" onClick={() => { closeModal(); }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    )
}