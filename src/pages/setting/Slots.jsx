import axios from "axios";
import { Link, useParams } from 'react-router';

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Cookies from 'js-cookie';
// Utility to merge inline styles (for cleaner JSX)
const mergeStyles = (defaultStyle, newStyles) => ({ ...defaultStyle, ...newStyles });

const Slots = () => {
    // State for slot settings
    const [slotDuration, setSlotDuration] = useState('');
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [bufferTime, setBufferTime] = useState('');
    const [lunchStart, setLunchStart] = useState("");
    const [lunchEnd, setLunchEnd] = useState("");

    const [storeData, setstoreData] = useState([])
    const [newslot, setnewslot] = useState({})

    const slotOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

    const [appointmentNo, setappointmentNo] = useState('')
    const {id}=useParams()

    // Function to generate available slots (kept from original)
    const generateSlots = () => {
        let slots = [];
        let currentTime = convertTimeToMinutes(startTime);
        const endTimeInMinutes = convertTimeToMinutes(endTime);
        const lunchStartInMinutes = convertTimeToMinutes(lunchStart);
        const lunchEndInMinutes = convertTimeToMinutes(lunchEnd);

        while (currentTime + slotDuration <= endTimeInMinutes) {
            // Skip lunch break
            if (currentTime >= lunchStartInMinutes && currentTime < lunchEndInMinutes) {
                currentTime = lunchEndInMinutes; // Jump to end of lunch
            }

            let stime = convertMinutesToTime(currentTime);
            let etime = convertMinutesToTime(currentTime + slotDuration);

            slots.push({ stime, etime });

            currentTime += slotDuration + bufferTime; // Move to next slot with buffer
        }

        console.log(slots);
        return slots;
    };

    const USER_ID =  id
    const BASE_API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchdata = async () => {
            try {
                let res = await axios.post(
                    `${BASE_API_URL}/get_profile/${USER_ID}/`,
                    {}, {
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": "1234",
                    },
                }
                );

                // Ensure data types are correct when setting state from API
                setBufferTime(Number(res.data.slots.parameter.buffertime) || 0)
                setEndTime(res.data.slots.parameter.endtime)
                setStartTime(res.data.slots.parameter.starttime)
                setLunchStart(res.data.slots.parameter.lunchstarttime)
                setLunchEnd(res.data.slots.parameter.lunchendtime)
                setSlotDuration(Number(res.data.slots.parameter.slotduration) || slotOptions[0])
                setappointmentNo(res.data.slots.parameter.maxappointmentno || 1)
                
                // Ensure array data for storeData is correctly typed (duration as number)
                setstoreData(res.data.slots.slotsvalue.map(slot => ({
                    ...slot,
                    duration: Number(slot.duration.$numberInt || slot.duration) // Handling potential nested or string numbers
                })));

            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        };
        fetchdata();
    }, []);


    // Convert HH:MM to total minutes
    const convertTimeToMinutes = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        return hours * 60 + minutes;
    };

    // Convert total minutes back to HH:MM
    const convertMinutesToTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    };

    // Handle Save (Generate Slots logic)
    const handleSave = () => {
        // alert('Button Disabled!') // Keep disabled logic for now if intended

        // Note: The original implementation *always* generates slots on load and *only* saves on the 'Save Setting' button.
        // I'll update this function to generate and set the slots, as the button text suggests.

        const availableSlots = generateSlots();
        const dtFormatted = availableSlots.map(item => ({ slot: item, maxno: appointmentNo, duration: slotDuration }));
        setstoreData(dtFormatted);

        // Optional: show a temporary success alert here if needed
        // Swal.fire("Generated!", "New slots have been generated.", "info");

    };


    const [finalslots, setfinalslots] = useState({})

    useEffect(() => {
        const d = {
            slots: {
                parameter: {
                    slotduration: slotDuration,
                    starttime: startTime,
                    endtime: endTime,
                    buffertime: bufferTime,
                    lunchstarttime: lunchStart,
                    lunchendtime: lunchEnd,
                    maxappointmentno: appointmentNo
                },
                slotsvalue: storeData
            },
        }
        setfinalslots(d)
    }, [storeData, slotDuration, startTime, endTime, bufferTime, lunchStart, lunchEnd, appointmentNo])


    const handleDurationChange = (e, index) => {
        const newDuration = parseInt(e.target.value, 10);
        if (isNaN(newDuration) || newDuration < 0) return; // Basic validation

        setstoreData((prev) => {
            let updatedArray = [...prev];

            // Convert lunch break times to minutes
            const lunchStartInMinutes = convertTimeToMinutes(lunchStart);
            const lunchEndInMinutes = convertTimeToMinutes(lunchEnd);

            // Update the selected slot's duration and adjust end time
            updatedArray[index] = {
                ...updatedArray[index],
                duration: newDuration,
                slot: {
                    ...updatedArray[index].slot,
                    etime: convertMinutesToTime(convertTimeToMinutes(updatedArray[index].slot.stime) + newDuration)
                }
            };

            // Reschedule all subsequent slots
            for (let i = index + 1; i < updatedArray.length; i++) {
                let prevSlot = updatedArray[i - 1];
                let newStartTime = convertTimeToMinutes(prevSlot.slot.etime) + bufferTime; // Start after buffer time

                // **Check if the new start time falls into lunch break**
                if (newStartTime >= lunchStartInMinutes && newStartTime < lunchEndInMinutes) {
                    newStartTime = lunchEndInMinutes; // Move start time to end of lunch
                }

                let newEndTime = newStartTime + updatedArray[i].duration;

                updatedArray[i] = {
                    ...updatedArray[i],
                    slot: {
                        stime: convertMinutesToTime(newStartTime),
                        etime: convertMinutesToTime(newEndTime)
                    }
                };
            }

            return updatedArray;
        });
    };

    const setData = () => {
        if (storeData.length > 10) {
            Swal.fire('Limit Exceeded', 'You have a maximum slot limit of 10.', 'error')
            return;
        }

        Swal.fire({
            title: "Are you sure?",
            text: "You want to update the file!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#17a2b8", // Updated button color
            cancelButtonColor: "#dc3545", // Updated button color
            confirmButtonText: "Yes, Update!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.post(
                        `${BASE_API_URL}/update_user/${USER_ID}/`,
                        finalslots, {
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": "1234",
                        },
                    }
                    );
                    Swal.fire({
                        title: "Updated!",
                        text: "Your file has been Updated.",
                        icon: "success"
                    });

                } catch (error) {
                    console.error("Error updating user profile:", error);
                    Swal.fire("Error!", "Failed to update settings.", "error");
                }
            }
        });
    }

    // --- UI Improvement: Grouping and Layout ---

    const SlotSettingInput = ({ label, children }) => (
        <div style={styles.inputGroup}>
            <label style={styles.label}>{label}</label>
            <div style={styles.inputWrapper}>
                {children}
            </div>
        </div>
    );

    const SlotListHeader = () => (
        <div style={styles.slotListHeader}>
            <span style={styles.slotListItem}>Start Time</span>
            <span style={styles.slotListItem}>Duration</span>
            <span style={styles.slotListItem}>End Time</span>
            <span style={mergeStyles(styles.slotListItem, { width: '25%' })}>Limit</span>
            <span style={mergeStyles(styles.slotListItem, { width: '10%' })}></span> {/* For Delete Icon */}
        </div>
    );

    const SlotListItem = ({ item, index }) => {
        const isLunchBreak = item.slot.stime === lunchStart && item.slot.etime === lunchEnd;

        const handleTimeChange = (e, key) => {
            const newTime = e.target.value;
            setstoreData((prev) => {
                let updatedArray = [...prev];
                updatedArray[index] = {
                    ...updatedArray[index],
                    slot: { ...updatedArray[index].slot, [key]: newTime }
                };
                return updatedArray;
            });
        };

        const handleMaxNoChange = (e) => {
            const newMaxNo = e.target.value;
            setstoreData((prev) => {
                let updatedArray = [...prev];
                updatedArray[index] = { ...updatedArray[index], maxno: newMaxNo };
                return updatedArray;
            });
        };

        return (
            <div style={mergeStyles(styles.slotListItemRow, isLunchBreak && styles.lunchSlot)}>
                <input
                    type="time"
                    style={styles.timeInput}
                    value={item.slot.stime}
                    onChange={(e) => handleTimeChange(e, 'stime')}
                />
                <input
                    type="number"
                    style={styles.durationInput}
                    value={item.duration}
                    onChange={(e) => handleDurationChange(e, index)}
                    min="1"
                />
                <input
                    type="time"
                    style={styles.timeInput}
                    value={item.slot.etime}
                    onChange={(e) => handleTimeChange(e, 'etime')}
                />
                <input
                    type="number"
                    style={styles.limitInput}
                    value={item.maxno}
                    onChange={handleMaxNoChange}
                    min="1"
                />
                <button
                    style={styles.deleteButton}
                    onClick={() => setstoreData((prev) => prev.filter((_, i) => i !== index))}
                >
                    &times;
                </button>
            </div>
        );
    };

    const AddNewSlot = () => (
        <div style={styles.addNewSlotContainer}>
            <input
                type="time"
                style={styles.timeInput}
                onChange={(e) => setnewslot({ ...newslot, stime: e.target.value, duration: 60, maxno: appointmentNo })}
                placeholder="Start"
            />
            <input
                type="time"
                style={styles.timeInput}
                onChange={(e) => setnewslot({ ...newslot, etime: e.target.value, duration: 60, maxno: appointmentNo })}
                placeholder="End"
            />
            <button
                style={styles.addButton}
                onClick={() => {
                    if (newslot.stime && newslot.etime) {
                        const durationMinutes = convertTimeToMinutes(newslot.etime) - convertTimeToMinutes(newslot.stime);
                        setstoreData([...storeData, { slot: { stime: newslot.stime, etime: newslot.etime }, maxno: newslot.maxno || appointmentNo, duration: durationMinutes > 0 ? durationMinutes : 60 }]);
                        setnewslot({}); // Clear inputs
                    } else {
                        Swal.fire('Missing Time', 'Please select both start and end time for the new slot.', 'warning');
                    }
                }}
            >
                + Add Slot
            </button>
        </div>
    );


    return (
        <div style={styles.root}>
            <div style={styles.container}>
                <h2 style={styles.heading}>Appointment Slot Management</h2>

                {/* --- Slot Parameters --- */}
                <div style={styles.settingsSection}>
                    <h3 style={styles.subHeading}>Slot Parameters</h3>
                    <SlotSettingInput label="Slot Duration (min)">
                        <select style={styles.selectInput} value={slotDuration} onChange={(e) => setSlotDuration(Number(e.target.value))}>
                            {slotOptions.map((time) => (
                                <option key={time} value={time}>
                                    {time} mins
                                </option>
                            ))}
                        </select>
                    </SlotSettingInput>

                    <SlotSettingInput label="Buffer Time (min)">
                        <input
                            type="number"
                            style={styles.input}
                            value={bufferTime}
                            onChange={(e) => setBufferTime(Number(e.target.value))}
                            min="0"
                        />
                    </SlotSettingInput>

                    <SlotSettingInput label="Max Appointments/Slot">
                        <input
                            type="number"
                            style={styles.input}
                            value={appointmentNo}
                            onChange={(e) => setappointmentNo(e.target.value)}
                            min="1"
                        />
                    </SlotSettingInput>

                    <hr style={styles.divider} />

                    <h3 style={styles.subHeading}>Working Hours</h3>
                    <SlotSettingInput label="Start Time">
                        <input type="time" style={styles.input} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </SlotSettingInput>

                    <SlotSettingInput label="End Time">
                        <input type="time" style={styles.input} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </SlotSettingInput>

                    <hr style={styles.divider} />

                    <h3 style={styles.subHeading}>Lunch Break</h3>
                    <SlotSettingInput label="Lunch Start Time">
                        <input type="time" style={styles.input} value={lunchStart} onChange={(e) => setLunchStart(e.target.value)} />
                    </SlotSettingInput>

                    <SlotSettingInput label="Lunch End Time">
                        <input type="time" style={styles.input} value={lunchEnd} onChange={(e) => setLunchEnd(e.target.value)} />
                    </SlotSettingInput>
                </div>

                {/* --- Action Buttons --- */}
                <div style={styles.buttonGroup}>
                    <button style={styles.generateButton} onClick={handleSave}>
                        Generate Default Slots [Image of Refresh Icon]
                    </button>
                    <button style={styles.saveButton} onClick={setData}>
                        Save All Settings [Image of Save Icon]
                    </button>
                </div>

                {/* --- Slot List --- */}
                <div style={styles.slotListSection}>
                    <h3 style={styles.subHeading}>Generated Slots ({storeData.length})</h3>
                    <SlotListHeader />
                    <div style={styles.scrollableList}>
                        {storeData && storeData.map((item, index) => (
                            <SlotListItem key={index} item={item} index={index} />
                        ))}
                    </div>
                </div>

                <AddNewSlot />

            </div>
        </div>
    );
};

// Updated Inline Styles for better UI/UX
const styles = {
    root: {
        // width: '100vw',
        // minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        // padding: '10px 0',
        fontFamily: 'Arial, sans-serif',
    },
    container: {
        width: "100%",
        maxWidth: "1100px",
        background: 'white',
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        display: 'flex',
        flexDirection: 'column',
    },
    heading: {
        fontSize: "1.2rem",
        marginBottom: "20px",
        color: '#343a40',
        textAlign: 'center',
        fontWeight: '600',
    },
    subHeading: {
        fontSize: "1rem",
        marginTop: "15px",
        marginBottom: "10px",
        fontWeight: "600",
        color: '#495057',
        borderBottom: '1px solid #f8f9fa',
        paddingBottom: '5px'
    },
    // --- Form Inputs ---
    inputGroup: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr', // Label and Input in two columns
        alignItems: 'center',
        gap: '10px',
        marginTop: '10px',
    },
    label: {
        color: '#495057',
        fontSize: '0.9rem',
        textAlign: 'left',
        fontWeight: 'normal',
    },
    inputWrapper: {
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
    },
    input: {
        padding: '6px 10px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        fontSize: '0.9rem',
        color: '#495057',
        width: '100%',
        boxSizing: 'border-box',
    },
    selectInput: {
        padding: '6px 10px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        fontSize: '0.9rem',
        color: '#495057',
        width: '100%',
    },
    divider: {
        border: '0',
        borderTop: '1px solid #e9ecef',
        margin: '15px 0',
    },

    // --- Buttons ---
    buttonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        margin: '20px 0',
    },
    generateButton: {
        backgroundColor: '#ffc107', // Warning/Action color
        color: '#212529',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
        transition: 'background-color 0.3s',
        // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        '&:hover': {
            backgroundColor: '#e0a800',
        },
    },
    saveButton: {
        backgroundColor: '#007bff', // Primary color
        color: 'white',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '600',
        transition: 'background-color 0.3s',
        // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        '&:hover': {
            backgroundColor: '#0056b3',
        },
    },

    // --- Slot List ---
    slotListSection: {
        marginBottom: '20px',
    },
    slotListHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        background: '#e9ecef',
        padding: '8px 10px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '#495057',
        marginBottom: '5px',
    },
    slotListItem: {
        textAlign: 'center',
        width: '25%', // 4 columns total (Time, Duration, Time, Limit)
    },
    scrollableList: {
        maxHeight: '200px',
        overflowY: 'auto',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        padding: '5px',
    },
    slotListItemRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#f8f9fa',
        padding: '5px',
        borderRadius: '3px',
        margin: '2px 0',
        border: '1px solid #e9ecef',
    },
    lunchSlot: {
        backgroundColor: '#fff3cd', // Light yellow for lunch break
        borderLeft: '4px solid #ffc107',
    },
    timeInput: {
        background: 'transparent',
        border: 'none',
        width: '25%',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#212529',
    },
    durationInput: {
        background: 'transparent',
        border: 'none',
        width: '20%',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#212529',
    },
    limitInput: {
        background: 'transparent',
        border: 'none',
        width: '20%',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#212529',
    },
    deleteButton: {
        background: 'none',
        border: 'none',
        color: '#dc3545',
        cursor: 'pointer',
        fontSize: '1.2rem',
        lineHeight: '1',
        padding: '0 5px',
        width: '10%',
    },

    // --- Add New Slot ---
    addNewSlotContainer: {
        display: 'flex',
        gap: '5px',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '10px',
        borderTop: '1px solid #e9ecef',
    },
    addButton: {
        backgroundColor: '#28a745', // Success color
        color: 'white',
        border: 'none',
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        width: '30%',
    }
};

export default Slots;