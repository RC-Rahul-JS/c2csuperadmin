import { useEffect, useState } from "react";
import useApi from "../../api/useApi";
import { Link, useParams } from "react-router";
import Cookies from "js-cookie";
import Swal from 'sweetalert2';
import { useUser } from "../../context/UserContext";
import axios from "axios";

const Slots = () => {
  const { postData,getData } = useApi();
  const user = useUser();
  const {id}=useParams()
  // Remove or keep based on needs:
  // const hasPermission = user?.permissions.includes("Date and Slots Setting");

  // State for slot settings
  const [slotDuration, setSlotDuration] = useState(30);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [bufferTime, setBufferTime] = useState(10);
  const [lunchStart, setLunchStart] = useState("13:00");
  const [lunchEnd, setLunchEnd] = useState("14:00");
  const [appointmentNo, setAppointmentNo] = useState(1);
  const [storeData, setStoreData] = useState([]);

  const slotOptions = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

  // Convert HH:MM to minutes
  const convertTimeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes to HH:MM
  const convertMinutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  // Generate slots based on inputs
  const generateSlots = () => {
    const slots = [];
    let currentTime = convertTimeToMinutes(startTime);

    const endMinutes = convertTimeToMinutes(endTime);
    const lunchStartMin = convertTimeToMinutes(lunchStart);
    const lunchEndMin = convertTimeToMinutes(lunchEnd);

    while (currentTime + slotDuration <= endMinutes) {
      // Skip lunch
      if (currentTime >= lunchStartMin && currentTime < lunchEndMin) {
        currentTime = lunchEndMin;
      }

      const stime = convertMinutesToTime(currentTime);
      const etime = convertMinutesToTime(currentTime + slotDuration);

      slots.push({
        slot: { stime, etime },
        maxno: appointmentNo,
        duration: slotDuration,
      });

      currentTime += slotDuration + bufferTime;
    }

    setStoreData(slots);
    Swal.fire({
      title: "Slots Generated!",
      text: `${slots.length} slots created.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };


   useEffect(() => {
    const fetchdata = async () => {
      try {
    const response = await axios.get(`https://api.care2connect.in/get_doctor/${id}/`);
    console.log(response.data); // yaha doctors ka list milega
     const slots = response.data.slots;

        setSlotDuration(slots.parameter.slotduration || 30);
        setStartTime(slots.parameter.starttime || "09:00");
        setEndTime(slots.parameter.endtime || "17:00");
        setBufferTime(slots.parameter.buffertime || 10);
        setLunchStart(slots.parameter.lunchstarttime || "13:00");
        setLunchEnd(slots.parameter.lunchendtime || "14:00");
        setAppointmentNo(slots.parameter.maxappointmentno || 1);
        setStoreData(slots.slotsvalue || []);
  } catch (error) {
    console.error("Error fetching doctors:", error);
  }
    };
    fetchdata();
  }, []);
  // Load existing data
  // useEffect(() => {
  //   const fetchdata = async () => {
  //     try {
  //       const res = await getData(`/doctors/${id}`, {});
  //       const slots = res.slots;

  //       setSlotDuration(slots.parameter.slotduration || 30);
  //       setStartTime(slots.parameter.starttime || "09:00");
  //       setEndTime(slots.parameter.endtime || "17:00");
  //       setBufferTime(slots.parameter.buffertime || 10);
  //       setLunchStart(slots.parameter.lunchstarttime || "13:00");
  //       setLunchEnd(slots.parameter.lunchendtime || "14:00");
  //       setAppointmentNo(slots.parameter.maxappointmentno || 1);
  //       setStoreData(slots.slotsvalue || []);
  //     } catch (error) {
  //       console.error("Failed to load profile:", error);
  //     }
  //   };
  //   fetchdata();
  // }, []);

  // Handle individual slot duration change with auto-rescheduling
  const handleDurationChange = (e, index) => {
    const newDuration = parseInt(e.target.value, 10);
    setStoreData((prev) => {
      const updatedArray = [...prev];
      const lunchStartMin = convertTimeToMinutes(lunchStart);
      const lunchEndMin = convertTimeToMinutes(lunchEnd);

      // Update current slot's duration and end time
      const startMin = convertTimeToMinutes(updatedArray[index].slot.stime);
      updatedArray[index] = {
        ...updatedArray[index],
        duration: newDuration,
        slot: {
          stime: updatedArray[index].slot.stime,
          etime: convertMinutesToTime(startMin + newDuration),
        },
      };

      // Reschedule subsequent slots
      for (let i = index + 1; i < updatedArray.length; i++) {
        const prevEndMin = convertTimeToMinutes(updatedArray[i - 1].slot.etime);
        let newStartMin = prevEndMin + bufferTime;

        if (newStartMin >= lunchStartMin && newStartMin < lunchEndMin) {
          newStartMin = lunchEndMin;
        }

        const newEndMin = newStartMin + updatedArray[i].duration;
        updatedArray[i] = {
          ...updatedArray[i],
          slot: {
            stime: convertMinutesToTime(newStartMin),
            etime: convertMinutesToTime(newEndMin),
          },
        };
      }

      return updatedArray;
    });
  };

  // Delete a slot
  const deleteSlot = (index) => {
    setStoreData((prev) => prev.filter((_, i) => i !== index));
  };

  // Add custom slot
  const [newSlot, setNewSlot] = useState({ stime: "", etime: "" });
  const addCustomSlot = () => {
    if (!newSlot.stime || !newSlot.etime) {
      alert("Please fill both start and end time.");
      return;
    }
    const duration = convertTimeToMinutes(newSlot.etime) - convertTimeToMinutes(newSlot.stime);
    if (duration <= 0) {
      alert("End time must be after start time.");
      return;
    }
    setStoreData([
      ...storeData,
      {
        slot: { stime: newSlot.stime, etime: newSlot.etime },
        maxno: appointmentNo,
        duration,
      },
    ]);
    setNewSlot({ stime: "", etime: "" });
  };

  // Save all data
  const saveSettings = () => {
    const finalData = {
      slots: {
        parameter: {
          slotduration: slotDuration,
          starttime: startTime,
          endtime: endTime,
          buffertime: bufferTime,
          lunchstarttime: lunchStart,
          lunchendtime: lunchEnd,
          maxappointmentno: appointmentNo,
        },
        slotsvalue: storeData,
      },
    };

    Swal.fire({
      title: "Are you sure?",
      text: "You want to update the slot settings!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Save!",
    }).then((result) => {x
      if (result.isConfirmed) {
        postData(`/doctors/${id}`, finalData).then(() => {
          Swal.fire({
            title: "Updated!",
            text: "Slot settings saved successfully.",
            icon: "success",
          });
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white px-4 py-6">
      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-black mb-5 text-center">Slot Settings</h2>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-black text-sm font-medium">Slot Duration</label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              className="paramertinput w-32 px-3 py-1.5 border border-gray-400 rounded text-sm focus:outline-none"
            >
              {slotOptions.map((min) => (
                <option key={min} value={min}>{min} mins</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-black text-sm font-medium">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="paramertinput px-3 py-1.5 border border-gray-400 rounded text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-black text-sm font-medium">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="paramertinput px-3 py-1.5 border border-gray-400 rounded text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-black text-sm font-medium">Buffer Time (mins)</label>
            <input
              type="number"
              value={bufferTime}
              onChange={(e) => setBufferTime(Number(e.target.value))}
              min="0"
              className="paramertinput w-24 px-3 py-1.5 border border-gray-400 rounded text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-black text-sm font-medium">Lunch Start</label>
            <input
              type="time"
              value={lunchStart}
              onChange={(e) => setLunchStart(e.target.value)}
              className="paramertinput px-3 py-1.5 border border-gray-400 rounded text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-black text-sm font-medium">Lunch End</label>
            <input
              type="time"
              value={lunchEnd}
              onChange={(e) => setLunchEnd(e.target.value)}
              className="paramertinput px-3 py-1.5 border border-gray-400 rounded text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-black text-sm font-medium">Appointments per Slot</label>
            <input
              type="number"
              value={appointmentNo}
              onChange={(e) => setAppointmentNo(e.target.value)}
              min="1"
              className="paramertinput w-24 px-3 py-1.5 border border-gray-400 rounded text-sm"
            />
          </div>
        </div>

        {/* Generate Slots Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={generateSlots}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Generate Slots
          </button>
        </div>

        {/* Generated Slots Table */}
        {storeData.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-5 text-xs font-bold text-black bg-gray-100 p-1.5 rounded">
              <span>Start</span>
              <span>Duration</span>
              <span>End</span>
              <span>Limit</span>
              <span>Action</span>
            </div>

            <div className="space-y-1 mt-2">
              {storeData.map((item, index) => (
                <div key={index} className="grid grid-cols-5 items-center bg-gray-100 p-2 rounded text-sm">
                  <span>{item.slot.stime}</span>
                  <input
                    type="number"
                    value={item.duration}
                    onChange={(e) => handleDurationChange(e, index)}
                    className="px-2 py-1 w-16 text-center border border-gray-400 rounded text-xs"
                  />
                  <span>{item.slot.etime}</span>
                  <input
                    type="number"
                    value={item.maxno}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStoreData((prev) =>
                        prev.map((s, i) => (i === index ? { ...s, maxno: val } : s))
                      );
                    }}
                    className="px-2 py-1 w-16 text-center border border-gray-400 rounded text-xs"
                  />
                  <button
                    onClick={() => deleteSlot(index)}
                    className="text-red-600 hover:text-red-800 text-lg"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Add Custom Slot */}
        <div className="mt-6 flex items-center gap-2">
          <input
            type="time"
            value={newSlot.stime}
            onChange={(e) => setNewSlot({ ...newSlot, stime: e.target.value })}
            className="px-3 py-1 border border-gray-400 rounded text-sm"
          />
          <span>–</span>
          <input
            type="time"
            value={newSlot.etime}
            onChange={(e) => setNewSlot({ ...newSlot, etime: e.target.value })}
            className="px-3 py-1 border border-gray-400 rounded text-sm"
          />
          <button
            onClick={addCustomSlot}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            Add
          </button>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={saveSettings}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default Slots;