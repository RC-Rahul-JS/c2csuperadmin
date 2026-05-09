import React, { useEffect, useState } from "react";
import useApi from "../../api/useApi";
import { Link, useParams } from "react-router";
import Cookies from "js-cookie";
import Swal from 'sweetalert2';
import axios from "axios";

const DateSetting = () => {
  const { postData,getData } = useApi();
  const {id}=useParams()

  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableDays, setAvailableDays] = useState([]);
  const [holidays, setHolidays] = useState(['2025-02-25']);
  const [xdays, setXDays] = useState([]);
  const [next7days, setNext7Days] = useState([]);

  // Get year, month, and first day of month
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Days of the week
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Navigate months
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Fetch initial data

   useEffect(() => {
    const fetchdata = async () => {
      try {
    const response = await axios.get(`https://api.care2connect.in/get_doctor/${id}/`);
    console.log(response.data); // yaha doctors ka list milega
     const res = response.data;
 setAvailableDays(res.date.parameter.week.map(item => item.name));
        setHolidays(res.date.parameter.holiday.map(item => item.name));
  } catch (error) {
    console.error("Error fetching doctors:", error);
  }
    };
    fetchdata();
  }, []);
  // useEffect(() => {
  //   const fetchdata = async () => {
  //       console.log(id)
  //     try {
  //       const res = await getData(`/doctors/${id}`);
  //       console.log(res)
  //       setAvailableDays(res.date.parameter.week.map(item => item.name));
  //       setHolidays(res.date.parameter.holiday.map(item => item.name));
  //     } catch (error) {
  //       console.error("Failed to load profile:", error);
  //     }
  //   };
  //   fetchdata();
  // }, []);

  // Toggle weekday availability
  const toggleAvailability = (dayIndex) => {
    setAvailableDays((prev) =>
      prev.includes(dayIndex)
        ? prev.filter((d) => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  // Handle clicking on a calendar day
  const handleDateClick = (day) => {
    const date = new Date(year, month, day);
    const formattedDate = date.toISOString().split("T")[0];

    if (!availableDays.includes(date.getDay())) return;

    setHolidays((prev) =>
      prev.includes(formattedDate)
        ? prev.filter((d) => d !== formattedDate)
        : [...prev, formattedDate]
    );
  };

  // Generate next 7 days
  // const getNext7Days = () => {
  //   const dates = [];
  //   for (let i = 0; i < 7; i++) {
  //     const date = new Date();
  //     date.setDate(date.getDate() + i);
  //     dates.push(date.toISOString().split('T')[0]);
  //   }
  //   setNext7Days(dates);
  // };

  // Compute disable dates (holidays + unavailable weekdays)
  useEffect(() => {
    // getNext7Days();

    // Adjust holiday dates (+1 day fix if needed)
    const updatedHolidays = holidays.map(date => {
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() + 1);
      return newDate.toISOString().split('T')[0];
    });

    // Next 15 days that are NOT in availableDays
    const today = new Date();
    const next15OffDays = [];
    for (let i = 0; i < 15; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      if (!availableDays.includes(nextDate.getDay())) {
        next15OffDays.push(nextDate.toISOString().split("T")[0]);
      }
    }

    const combinedXDays = [...updatedHolidays, ...next15OffDays];
    setXDays(combinedXDays);

    // Prepare final payload
    const finalData = {
      date: {
        parameter: {
          week: availableDays.map((day, index) => ({ id: index, name: day })),
          holiday: holidays.map((day, index) => ({ id: index, name: day })),
        },
        disabledate: combinedXDays.map((day, index) => ({ id: index, name: day })),
      },
    };

    // Save to state (you can pass up via callback if needed)
    // setFinalData(finalData); // Uncomment if storing
  }, [holidays, availableDays]);

  // Save settings
  const save = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You want to update the settings!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Update!",
    }).then((result) => {
      if (result.isConfirmed) {
        postData(`/doctors/${id}`, {
          date: {
            parameter: {
              week: availableDays.map((day, index) => ({ id: index, name: day })),
              holiday: holidays.map((day, index) => ({ id: index, name: day })),
            },
            disabledate: xdays.map((day, index) => ({ id: index, name: day })),
          },
        }).then(() => {
          Swal.fire({
            title: "Updated!",
            text: "Your settings have been saved.",
            icon: "success",
          });
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center p-4">
      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
        {/* Available Days Selection */}
        <div className="mb-5">
          <label className="block text-black text-sm font-medium mb-2">
            <strong>Set Available Days:</strong>
          </label>
          <div className="flex justify-center gap-1">
            {weekDays.map((day, index) => (
              <button
                key={index}
                onClick={() => toggleAvailability(index)}
                className={`px-2 py-1 text-xs font-medium text-white rounded-md transition-colors ${
                  availableDays.includes(index) ? 'bg-green-600' : 'bg-gray-500'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={prevMonth}
            className="text-sm bg-gray-200 text-black px-3 py-1 rounded hover:bg-gray-300"
          >
            ◀
          </button>
          <h3 className="text-black text-sm font-medium">
            {currentDate.toLocaleString("default", { month: "long" })} {year}
          </h3>
          <button
            onClick={nextMonth}
            className="text-sm bg-gray-200 text-black px-3 py-1 rounded hover:bg-gray-300"
          >
            ▶
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 text-xs font-bold text-black mb-1">
          {weekDays.map((day) => (
            <div key={day} className="p-1 text-center">{day}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mt-2">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2"></div>
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const date = new Date(year, month, day);
            const formattedDate = date.toISOString().split("T")[0];
            const isAvailable = availableDays.includes(date.getDay());
            const isHoliday = holidays.includes(formattedDate);

            return (
              <div
                key={day}
                onClick={() => handleDateClick(day)}
                className={`aspect-square flex items-center justify-center text-xs font-medium rounded-md cursor-pointer transition-colors
                  ${!isAvailable ? 'bg-gray-400 cursor-not-allowed' : ''}
                  ${isAvailable && !isHoliday ? 'bg-green-600 hover:bg-green-700' : ''}
                  ${isHoliday ? 'bg-red-500 hover:bg-red-600' : ''}
                  ${!isHoliday && isAvailable ? 'hover:brightness-110' : ''}
                `}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 w-full max-w-md text-xs space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-500 rounded"></div>
          <span>Weekly off (not available)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <span>Available day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Holiday (blocked)</span>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8">
        <button
          onClick={save}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default DateSetting;