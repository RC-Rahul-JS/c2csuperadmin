import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import useApi from "../../api/useApi";
import Swal from "sweetalert2";
import moment from "moment";
import { useLoader } from "../../context/LoaderContext";
const API_BASE_URL = import.meta.env.VITE_API_URL;

const Applications = () => {
  const { getData } = useApi();
  const [hospitals, setHospitals] = useState([]);
  const [filterapplication, setfilterapplication] = useState("");
  const navigate=useNavigate()
  const {showLoader,hideLoader}=useLoader()

  // Fetch hospitals
useEffect(() => {
  const fetchHospitals = async () => {
    try {
      showLoader();
      const res = await getData("/onboard_list");

      if (Array.isArray(res)) {
        // Step 1: show hospitals immediately with placeholder
        const base_list = res.map((doc) => ({
          ...doc,
          profile_pic: "https://via.placeholder.com/150",
        }));
        setHospitals(base_list);

        // Step 2: load images in background
        res.forEach(async (doc, index) => {
          if (doc?.documents?.photo) {
            try {
              const url = await imageUrl(doc.documents.photo);
              if (url) {
                setHospitals((prev) =>
                  prev.map((h, i) =>
                    i === index ? { ...h, profile_pic: url } : h
                  )
                );
              }
            } catch (err) {
              console.error("Failed to fetch hospital image:", err);
            }
          }
        });
      } else {
        setHospitals([]);
      }
    } catch (error) {
      console.error("Failed to load hospitals:", error);
      Swal.fire("Error", "Could not Found Applications.", "error");
    } finally {
      hideLoader();
    }
  };

  fetchHospitals();
}, []);


    const imageUrl =async(id) => {
      try {
        const response = await fetch(`${API_BASE_URL}/image/${id}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (response.ok) {
          const blob = await response.blob();
          return URL.createObjectURL(blob);
        } else {
          console.error('Failed to fetch image');
          return null;
        }
      } catch (error) {
        console.error('Error fetching image:', error);
        return null;
      }
    }

   const filteredApplications = hospitals.filter((appt) => {
    // const apptDate = parseDate(appt.date_of_appointment);
    // const from = parseDate(fromDate);
    // const to = parseDate(toDate);

    const appMatch = filterapplication ? appt.status === filterapplication : true;
    // const fromMatch = from ? apptDate >= from : true;
    // const toMatch = to ? apptDate <= to : true;

    return appMatch ;
  });

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
     <div className="p-4 flex flex-wrap items-center gap-4">
        {/* Doctor Filter */}
        <div>
          <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
          <select
            value={filterapplication}
            onChange={(e) => setfilterapplication(e.target.value)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="">All</option>
            {['Pending','Approved','Rejected'].map((item, idx) => (
              <option key={idx} value={item}>{item || "N/A"}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
             <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
              {/* <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Specialist</th> */}
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Degree</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
              {/* <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Social Media</th> */}
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Apply Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredApplications.length > 0 ? 
              filteredApplications.map((doctor, index) => (
              <tr key={doctor._id} className="hover:bg-gray-50 transition-colors">
                  <td onClick={()=>navigate(`/settings/${doctor._id}/fees`)} className="px-6 py-4 whitespace-nowrap flex items-center">
                               <img
                                 src={doctor.profile_pic}
                                 alt={doctor.name}
                                 className="w-10 h-10 rounded-full object-cover border border-gray-200"
                               />
                               <span className="ml-3 font-medium text-gray-800">{doctor.title}</span>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.department||'Cardiology'}</td>
                             {/* <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.speciality}</td> */}
                             <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.degree||"MBBS,MD"}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.email}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.phone}</td>
                             {/* <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                               {doctor.socialMedia.join(', ')}
                             </td> */}
                             <td className="px-6 py-4 whitespace-nowrap text-gray-600">{moment(doctor.created_at).format("DD/MM/YYYY")}</td>
                             <td className="px-6 py-4 whitespace-nowrap space-x-3">
                               <button onClick={()=>navigate(doctor._id)} className="text-yellow-500 hover:text-yellow-700 transition-colors cursor-pointer">✎</button>
                               {/* <button className="text-red-500 hover:text-red-700 transition-colors cursor-pointer">✗</button> */}
                             </td>
                           </tr>
                         )):<tr className="hover:bg-gray-50 transition-colors">
                             <td className="px-6 py-4 whitespace-nowrap flex items-center">No Data Found</td>
                           </tr>}
          </tbody>
        </table>
      </div>
    </div>
  );

};

export default Applications;