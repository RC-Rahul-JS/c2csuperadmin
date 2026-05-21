import React, { useEffect, useState } from "react";

import { Link } from "react-router";
import useApi from "../../api/useApi";
import Swal from "sweetalert2";
import moment from "moment";

const Appointment = () => {
  const { getData } = useApi();
  const [appointments, setappointments] = useState([]);
  const [DoctorList, setDoctorList] = useState([])
  const [filterDoctor, setFilterDoctor] = useState("");
 const [fromDate, setFromDate] = useState(moment().format("YYYY-MM-DD"));
const [toDate, setToDate] = useState(moment().format("YYYY-MM-DD"));

  // Fetch appointments
  useEffect(() => {
    const fetchappointments = async () => {
      try {
        const res = await getData(`/get_appointments?from=${moment(fromDate).format('YYYY-MM-DD')}&to=${moment(toDate).format('YYYY-MM-DD')}`);
        console.log(res)
        if (Array.isArray(res)) {
          setappointments(res);
        } else {
          setappointments([]);
        }
      } catch (error) {
        console.error("Failed to load appointments:", error);
        Swal.fire("Error", "Could not load Appointment data.", "error");
      }
    };

    const doctor_list = async () => {
      try {
        const res = await getData(`/doctor_dropdown`);
        console.log(res)
        if (Array.isArray(res)) {
          setDoctorList(res);
        } else {
          setDoctorList([]);
        }
      } catch (error) {
        console.error("Failed to load appointments:", error);
        Swal.fire("Error", "Could not load Appointment data.", "error");
      }
    };
    fetchappointments();
    doctor_list()
  }, [fromDate,toDate]);

 

  const uniqueDoctors = [...new Set(appointments.map(a => a.doctor_name))];

  // Convert date string to Date object safely
  const parseDate = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const filteredAppointments = appointments.filter((appt) => {
    const apptDate = parseDate(appt.date_of_appointment);
    const from = parseDate(fromDate);
    const to = parseDate(toDate);

    const doctorMatch = filterDoctor ? appt.doctor_phone_id === filterDoctor : true;
    const fromMatch = from ? apptDate >= from : true;
    const toMatch = to ? apptDate <= to : true;

    return doctorMatch && fromMatch && toMatch;
  });

 const getdoctorname = (id) => {
  const doctor = DoctorList.find((item) => item._id === id);
  return doctor ? doctor.name : "Loading...";
};
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Filters */}
      <div className="p-4 flex flex-wrap items-center gap-4">
        {/* Doctor Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Filter by Doctor:</label>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="">All</option>
            {DoctorList.map((doctor, idx) => (
              <option key={idx} value={doctor._id}>{doctor.name || "N/A"}</option>
            ))}
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">S No</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Patient</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Time</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((hospital, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-800">{index + 1}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{hospital.patient_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{getdoctorname(hospital.doctor_phone_id)|| 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{hospital.date_of_appointment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{hospital.time_slot || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">{hospital.whatsapp_number || 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

};

export default Appointment;