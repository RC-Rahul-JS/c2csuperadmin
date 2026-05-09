import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Link, useParams } from "react-router";
import Swal from "sweetalert2";
import axios from "axios";
import useApi from "../../api/useApi";

const CalendarWithTimeSlots = () => {
  const { postData,getData } = useApi();
  const {id}=useParams()
  // Remove or keep based on your needs:
  // const hasPermission = user?.permissions.includes("Available Slots Manager");

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDay, setSelectedDay] = useState(dayjs().date()); // Default to today
  const [bookedSlots, setBookedSlots] = useState({});     // Count per slot
  const [bookedSlots2, setBookedSlots2] = useState({});   // Full appointment data
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotsArray, setSlotsArray] = useState([]);

  // Format month-year header
  const monthYear = currentMonth.format("MMMM YYYY");
  const yearMonth = currentMonth.format("YYYY-MM"); // For date building

  // Get days of the month
  const startOfMonth = currentMonth.startOf("month").day();
  const daysInMonth = currentMonth.daysInMonth();

  // Generate calendar grid
  const days = Array.from({ length: startOfMonth }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );



  // Fetch appointments for selected day
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await getData(`/get_appointments?from=2025-09-01&to=2025-09-10`);
        const successfulAppointments = res.filter((item) => item.status === "success");

        const today = `${yearMonth}-${String(selectedDay).padStart(2, "0")}`;
        const dailyAppointments = successfulAppointments.filter(
          (item) => item.date_of_appointment === today
        );

        if (dailyAppointments.length > 0) {
          // Count bookings per time slot
          const countBySlot = dailyAppointments.reduce((acc, item) => {
            acc[item.time_slot] = (acc[item.time_slot] || 0) + 1;
            return acc;
          }, {});

          // Group full data by time slot
          const groupedBySlot = dailyAppointments.reduce((acc, item) => {
            if (!acc[item.time_slot]) acc[item.time_slot] = [];
            acc[item.time_slot].push(item);
            return acc;
          }, {});

          setBookedSlots({ [today]: countBySlot });
          setBookedSlots2(groupedBySlot);
        } else {
          setBookedSlots({ [today]: {} });
          setBookedSlots2({});
        }
      } catch (error) {
        console.error("Failed to load appointments:", error);
      }
    };

    if (selectedDay) fetchAppointments();
  }, [selectedDay, yearMonth]);

  // Fetch doctor's time slots (from profile)
  useEffect(() => {
    const fetchProfile = async () => {

        try {
    const response = await axios.get(`https://api.care2connect.in/get_doctor/${id}/`);
    console.log(response.data); // yaha doctors ka list milega
     const res = response.data;
 setTimeSlots(res.slots?.slotsvalue || []);
  } catch (error) {
    console.error("Error fetching doctors:", error);
  }
      // try {
      //   const res = await getData(`/get_doctor/${id}`);
        
      // } catch (error) {
      //   console.error("Failed to load profile slots:", error);
      // }
    };
    fetchProfile();
  }, []);

  // Fetch enabled/disabled status of each slot
  const fetchEnabledSlots = async () => {
    try {
      const res = await postData("/get_slot", {});
      setSlotsArray(res || []);
    } catch (error) {
      console.error("Failed to load enabled slots:", error);
    }
  };

  useEffect(() => {
    fetchEnabledSlots();
  }, []);

  // Convert 24h → 12h format
  const convertTo12Hour = (time) => {
    let [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Send WhatsApp message using Meta Graph API
  const sendWhatsAppMessage = async (phoneNumber, date, slot) => {
    const accessToken = 'EACHqNPEWKbkBO33utbtE1EMW5T1B8KlYqSpLDepuZCdrEY9unIfGmwnlZB4XgfEFQw2ohjGAAoBL1OHY08kftSW0ZBEvX5eXIodrY2gghys3IEoyoKwZCvHh0ZBd7I6eB9ttTEV1fsghWvpzycfIr5pIVIeftLpO0jlFLp9FZB31dd48QZCzmYSxSvKuIFkZAOlchwZDZD';
    const phoneNumberId = '563776386825270';

    const payload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: "cancel_ap",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: date },
              { type: "text", text: slot },
            ],
          },
        ],
      },
    };

    try {
      await axios.post(
        `https://graph.facebook.com/v22.0/ ${phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (err) {
      console.error("WhatsApp send failed:", err.response?.data || err.message);
    }
  };

  // Broadcast cancellation messages
  const sendBroadcast = async (appointments) => {
    for (const appt of appointments) {
      await sendWhatsAppMessage(appt.whatsapp_number, appt.date_of_appointment, appt.time_slot);
    }
  };

  // Handle toggle enable/disable slot
  const handleToggleSlot = async (date, slot, isEnabled) => {
    if (isEnabled) {
      const confirm = await Swal.fire({
        title: "Are you sure?",
        html: `
          <p>This will cancel all ${bookedSlots2[slot]?.length || 0} confirmed appointments.</p>
          <p>WhatsApp alerts will be sent automatically.</p>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, Cancel All!",
      });

      if (confirm.isConfirmed) {
        // await sendBroadcast(bookedSlots2[slot]);
      } else {
        return; // Don't proceed if not confirmed
      }
    }

    // Update backend
    try {
      await postData("/slot_disable", { date, slot, enable: !isEnabled });
      Swal.fire({
        title: "Success!",
        text: `Slot has been ${isEnabled ? "disabled" : "enabled"} successfully.`,
        icon: "success",
      });
      fetchEnabledSlots(); // Refresh list
    } catch (error) {
      Swal.fire("Error!", "Failed to update slot.", "error");
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white px-4 py-6">
      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-black mb-5 text-center">Manage Appointment Slots</h2>

        {/* Month Navigation */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
            className="text-xl font-bold text-[#075e54] bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
          </button>
          <h3 className="text-base font-medium text-[#075e54]">{monthYear}</h3>
          <button
            onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
            className="text-xl font-bold text-[#075e54] bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
          </button>
        </div>

        {/* Weekdays Header */}
        <div className="grid grid-cols-7 gap-1 mb-2 text-xs font-bold text-white">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-center bg-[#075e54] rounded text-xs">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <button
              key={index}
              onClick={() => day && setSelectedDay(day)}
              disabled={!day}
              className={`aspect-square flex items-center justify-center text-sm font-medium rounded-md transition-all
                ${!day ? 'invisible' : ''}
                ${selectedDay === day
                  ? 'bg-[#4ABAB3] text-white font-bold'
                  : 'bg-white text-black hover:bg-gray-100'
                }
                border border-gray-200
              `}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Selected Day Time Slots */}
        {selectedDay && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-black mb-3">
              Booked Slots for {selectedDay} {monthYear}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {timeSlots.length > 0 ? (
                timeSlots.map((item) => {
                  const start = convertTo12Hour(item.slot.stime);
                  const end = convertTo12Hour(item.slot.etime);
                  const slotLabel = `${start} - ${end}`;
                  const dateKey = `${yearMonth}-${String(selectedDay).padStart(2, "0")}`;
                  const bookingCount = bookedSlots[dateKey]?.[slotLabel] || 0;
                  const isFullyBooked = bookingCount >= item.maxno;
                  const slotStatus = slotsArray.find(
                    (s) => s.slot === slotLabel && s.date === dateKey
                  );
                  const isEnabled = slotStatus ? slotStatus.enable : true;

                  let bgColor, textColor, cursor;

                  if (!isEnabled) {
                    bgColor = "bg-gray-300";
                    textColor = "text-gray-600";
                    cursor = "cursor-not-allowed";
                  } else if (isFullyBooked) {
                    bgColor = "bg-red-500";
                    textColor = "text-white";
                    cursor = "cursor-not-allowed";
                  } else {
                    bgColor = "bg-green-500";
                    textColor = "text-white";
                    cursor = "cursor-pointer";
                  }

                  return (
                    <div
                      key={slotLabel}
                      onClick={() =>
                        isEnabled && !isFullyBooked && handleToggleSlot(dateKey, slotLabel, isEnabled)
                      }
                      className={`${bgColor} ${textColor} ${cursor} px-3 py-2 text-xs font-bold rounded text-center transition hover:brightness-95`}
                      title={
                        !isEnabled
                          ? "Slot disabled"
                          : isFullyBooked
                          ? "Fully booked"
                          : "Click to disable"
                      }
                    >
                      {slotLabel} <br />
                      <span className="text-xs">
                        ({bookingCount}/{item.maxno})
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="col-span-full text-xs text-gray-500">No time slots defined.</p>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 space-y-1 text-xs text-black">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span>Disabled slot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Enabled / Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Fully Booked</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarWithTimeSlots;