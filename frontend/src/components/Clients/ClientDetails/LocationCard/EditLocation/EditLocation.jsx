import { useSelector, useDispatch } from "react-redux"
import { useState, useEffect } from "react"
import { useModal } from "../../../../../context/Modal";

import { editLocationThunk } from "../../../../../store/clients";

const STATES = [{ name: 'Alabama', abbreviation: 'AL' },
{ name: 'Alaska', abbreviation: 'AK' },
{ name: 'Arizona', abbreviation: 'AZ' },
{ name: 'Arkansas', abbreviation: 'AR' },
{ name: 'California', abbreviation: 'CA' },
{ name: 'Colorado', abbreviation: 'CO' },
{ name: 'Connecticut', abbreviation: 'CT' },
{ name: 'Delaware', abbreviation: 'DE' },
{ name: 'Florida', abbreviation: 'FL' },
{ name: 'Georgia', abbreviation: 'GA' },
{ name: 'Hawaii', abbreviation: 'HI' },
{ name: 'Idaho', abbreviation: 'ID' },
{ name: 'Illinois', abbreviation: 'IL' },
{ name: 'Indiana', abbreviation: 'IN' },
{ name: 'Iowa', abbreviation: 'IA' },
{ name: 'Kansas', abbreviation: 'KS' },
{ name: 'Kentucky', abbreviation: 'KY' },
{ name: 'Louisiana', abbreviation: 'LA' },
{ name: 'Maine', abbreviation: 'ME' },
{ name: 'Maryland', abbreviation: 'MD' },
{ name: 'Massachusetts', abbreviation: 'MA' },
{ name: 'Michigan', abbreviation: 'MI' },
{ name: 'Minnesota', abbreviation: 'MN' },
{ name: 'Mississippi', abbreviation: 'MS' },
{ name: 'Missouri', abbreviation: 'MO' },
{ name: 'Montana', abbreviation: 'MT' },
{ name: 'Nebraska', abbreviation: 'NE' },
{ name: 'Nevada', abbreviation: 'NV' },
{ name: 'New Hampshire', abbreviation: 'NH' },
{ name: 'New Jersey', abbreviation: 'NJ' },
{ name: 'New Mexico', abbreviation: 'NM' },
{ name: 'New York', abbreviation: 'NY' },
{ name: 'North Carolina', abbreviation: 'NC' },
{ name: 'North Dakota', abbreviation: 'ND' },
{ name: 'Ohio', abbreviation: 'OH' },
{ name: 'Oklahoma', abbreviation: 'OK' },
{ name: 'Oregon', abbreviation: 'OR' },
{ name: 'Pennsylvania', abbreviation: 'PA' },
{ name: 'Rhode Island', abbreviation: 'RI' },
{ name: 'South Carolina', abbreviation: 'SC' },
{ name: 'South Dakota', abbreviation: 'SD' },
{ name: 'Tennessee', abbreviation: 'TN' },
{ name: 'Texas', abbreviation: 'TX' },
{ name: 'Utah', abbreviation: 'UT' },
{ name: 'Vermont', abbreviation: 'VT' },
{ name: 'Virginia', abbreviation: 'VA' },
{ name: 'Washington', abbreviation: 'WA' },
{ name: 'West Virginia', abbreviation: 'WV' },
{ name: 'Wisconsin', abbreviation: 'WI' },
{ name: 'Wyoming', abbreviation: 'WY' }]

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
            <h2>Edit Location</h2>
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
                                {STATES.map((state) => (
                                    <option key={state.abbreviation} value={state.abbreviation}>
                                        {state.name}
                                    </option>
                                ))}
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
                        <button type="submit" className="submit-button" disabled={disabled}>Save Changes</button>
                        <button type="button" className="cancel-button" onClick={() => { closeModal(); }}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    )
}