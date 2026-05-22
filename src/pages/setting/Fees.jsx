import React, { useEffect, useState } from 'react';
import useApi from '../../api/useApi';
import { Link, useParams } from 'react-router';
import Cookies from 'js-cookie';
import Swal from 'sweetalert2';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL

const Fees = () => {
  const { postData,getData } = useApi();
  const {id}=useParams()
  const [doctorfee, setDoctorfee] = useState('');
  const [appointmentfee, setAppointmentfee] = useState('');
  const [platformfee, setPlatformfee] = useState('');
  
  const [seconddoctorfee, setSeconddoctorfee] = useState('');
  const [secondappointmentfee, setSecondappointmentfee] = useState('');
  const [secondplatfomfee, setSecondplatfomfee] = useState('');

  const [reappointmentdayslimit, setReappointmentdayslimit] = useState('');

  // Fetch current fees
  useEffect(() => {
    const fetchdata = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/get_doctor/${id}/`);
        console.log(response.data);
        setDoctorfee(response.data.doctorfee || '');
        setAppointmentfee(response.data.appointmentfee || '');
        setPlatformfee(response.data.platformfee || '');
        
        setSeconddoctorfee(response.data.seconddoctorfee || '');
        setSecondappointmentfee(response.data.secondappointmentfee || '');
        setSecondplatfomfee(response.data.secondplatfomfee || response.data.secondplatformfee || '');

        setReappointmentdayslimit(response.data.reappointmentdayslimit || '');
      } catch (error) {
        console.error("Error fetching doctor fees:", error);
      }
    };
    fetchdata();
  }, [id]);

  // Save updated fees
  const updates = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You want to update the fees!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Update!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await axios.post(
            `${API_BASE_URL}/update_user/${id}/`, // 🔥 match Flask route with /
            { 
              doctorfee: doctorfee,
              appointmentfee: appointmentfee,
              platformfee: platformfee,
              seconddoctorfee: seconddoctorfee,
              secondappointmentfee: secondappointmentfee,
              secondplatfomfee: secondplatfomfee,
              secondplatformfee: secondplatfomfee, // sent with both spellings for backend safety
              reappointmentdayslimit: reappointmentdayslimit
            }
          );

          if (res.data.success) {
            Swal.fire({
              title: 'Updated!',
              text: 'Fees have been saved successfully.',
              icon: 'success',
            });
          } else {
            Swal.fire({
              title: 'Info',
              text: res.data.message || 'No changes made',
              icon: 'info',
            });
          }
        } catch (error) {
          Swal.fire({
            title: 'Error!',
            text: error.response?.data?.error || 'Something went wrong!',
            icon: 'error',
          });
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-white px-4 py-6">
      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-black mb-6 text-center">Fees Parameter</h2>

        {/* Section: 1st Visit Fees */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-purple-600 mb-3 border-b pb-1">1st Visit Fees</h3>
          
          {/* Doctor Fee Input */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-black text-sm font-medium">Doctor Fee</label>
            <input
              type="text"
              value={doctorfee}
              onChange={(e) => setDoctorfee(e.target.value)}
              className="paramertinput w-32 px-3 py-1.5 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter fee"
            />
          </div>

          {/* Appointment Fee Input */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-black text-sm font-medium">Appointment Fee</label>
            <input
              type="text"
              value={appointmentfee}
              onChange={(e) => setAppointmentfee(e.target.value)}
              className="paramertinput w-32 px-3 py-1.5 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter fee"
            />
          </div>

          {/* Platform Fee Input */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-black text-sm font-medium">Platform Fee</label>
            <input
              type="text"
              value={platformfee}
              onChange={(e) => setPlatformfee(e.target.value)}
              className="paramertinput w-32 px-3 py-1.5 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter fee"
            />
          </div>
        </div>

        {/* Section: 2nd Visit Fees */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-purple-600 mb-3 border-b pb-1">2nd Visit Fees</h3>

          {/* 2nd Doctor Fee Input */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-black text-sm font-medium">2nd Doctor Fee</label>
            <input
              type="text"
              value={seconddoctorfee}
              onChange={(e) => setSeconddoctorfee(e.target.value)}
              className="paramertinput w-32 px-3 py-1.5 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter fee"
            />
          </div>

          {/* 2nd Appointment Fee Input */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-black text-sm font-medium">2nd Appointment Fee</label>
            <input
              type="text"
              value={secondappointmentfee}
              onChange={(e) => setSecondappointmentfee(e.target.value)}
              className="paramertinput w-32 px-3 py-1.5 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter fee"
            />
          </div>

          {/* 2nd Platform Fee Input */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-black text-sm font-medium">2nd Platform Fee</label>
            <input
              type="text"
              value={secondplatfomfee}
              onChange={(e) => setSecondplatfomfee(e.target.value)}
              className="paramertinput w-32 px-3 py-1.5 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter fee"
            />
          </div>
        </div>

        {/* Section: Reappointment Settings */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-purple-600 mb-3 border-b pb-1">Reappointment Settings</h3>

          {/* Reappointment Days Limit Input */}
          <div className="flex items-center justify-between mb-3">
            <label className="text-black text-sm font-medium">Reappointment Days Limit</label>
            <input
              type="text"
              value={reappointmentdayslimit}
              onChange={(e) => setReappointmentdayslimit(e.target.value)}
              className="paramertinput w-32 px-3 py-1.5 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 3"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center mt-4">
          <button
            onClick={updates}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          >
            Save Setting
          </button>
        </div>
      </div>
    </div>
  );
};

export default Fees;