import React, { useEffect, useState } from "react";
import { Link } from "react-router";
import useApi from "../../api/useApi";
import Swal from "sweetalert2";

const HospitalListTable = () => {
  const { getData } = useApi();
  const [hospitals, setHospitals] = useState([]);

  // Fetch hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await getData("/hospitals/get");
        if (Array.isArray(res)) {
          setHospitals(res);
        } else {
          setHospitals([]);
        }
      } catch (error) {
        console.error("Failed to load hospitals:", error);
        Swal.fire("Error", "Could not load hospital data.", "error");
      }
    };
    fetchHospitals();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Hospital</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Address</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Contact Person</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">License</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Established</th>
              {/* <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hospitals.length > 0 ? (
              hospitals.map((hospital, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {/* Hospital Name - Clickable */}
                  <td
                    // Example: navigate to hospital detail or fee settings
                    // onClick={() => navigate(`/hospital/${hospital._id}/settings`)}
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm border border-gray-200">
                        {hospital.hospital_name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="ml-3 font-medium text-gray-800">{hospital.hospital_name}</span>
                    </div>
                  </td>

                  {/* Address */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {hospital.address}, {hospital.city}, {hospital.state} - {hospital.pincode}
                  </td>

                  {/* Contact Person */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {hospital.contact_person || 'N/A'}
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {hospital.phone}
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {hospital.email || 'N/A'}
                  </td>

                  {/* License */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {hospital.license_number || 'N/A'}
                  </td>

                  {/* Established Year */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    {hospital.established_year || 'N/A'}
                  </td>

                  {/* Action Buttons (Optional) */}
                  {/* 
                  <td className="px-6 py-4 whitespace-nowrap space-x-3">
                    <button className="text-yellow-500 hover:text-yellow-700 transition-colors">✎</button>
                    <button className="text-red-500 hover:text-red-700 transition-colors">✗</button>
                  </td>
                  */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No hospitals found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

};

export default HospitalListTable;