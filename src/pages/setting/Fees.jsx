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
  const [fee, setFee] = useState('');

  // Fetch current appointment fee
  useEffect(() => {
    const fetchdata = async () => {
      try {
    const response = await axios.get(`https://api.care2connect.in/get_doctor/${id}/`);
    console.log(response.data); // yaha doctors ka list milega
    setFee(response.data.appointmentfee || '');
  } catch (error) {
    console.error("Error fetching doctors:", error);
  }
    };
    fetchdata();
  }, []);

  // Save updated fee
 const updates = () => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You want to update the appointment fee!',
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
          { appointmentfee: fee }
        );

        if (res.data.success) {
          Swal.fire({
            title: 'Updated!',
            text: 'Appointment fee has been saved.',
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
        <h2 className="text-lg font-semibold text-black mb-6 text-center">Fees Parameter</h2>

        {/* Appointment Fee Input */}
        <div className="flex items-center justify-between mb-6">
          <label className="text-black text-sm font-medium">Appointment Fee</label>
          <input
            type="number"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="paramertinput w-32 px-3 py-1.5 border border-gray-400 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter fee"
          />
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