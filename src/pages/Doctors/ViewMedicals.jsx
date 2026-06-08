import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const ViewMedicals = () => {
  const [medicals, setMedicals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMedicals = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("https://api.care2connect.in/c2c_app/medical/requests", {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (!res.ok) throw new Error("HTTP Status " + res.status);
        const data = await res.json();
        
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data && Array.isArray(data.requests)) list = data.requests;
        else if (data && Array.isArray(data.data)) list = data.data;
        else if (data && Array.isArray(data.medicals)) list = data.medicals;
        else if (data && typeof data === 'object') {
           list = Object.values(data).filter(v => typeof v === 'object');
        }

        // Filter for approved medicals only
        const approvedList = list
          .filter(item => (item.status || "").toLowerCase() === "approved" || (item.status || "").toLowerCase() === "approve")
          .map(item => {
            const m = item.medical || {};
            return {
              id: item.medical_id || item._id || item.id,
              status: item.status || 'Approved',
              doctorName: item.doctorName || item.doctor_name || 'N/A',
              doctorHospital: item.doctorHospital || item.doctor_hospital || 'None Selected',
              medicalName: m.medicalName || m.medical_name || item.medicalName || item.medical_name || item.name || 'N/A',
              whatsappNumber: m.whatsappNumber || m.whatsapp_number || item.whatsappNumber || item.phone || item.whatsapp_number || 'N/A',
              address: m.address || item.address || 'N/A',
              types: m.types || m.type || item.types || item.type || 'N/A',
              licenseNumber: m.licenseNumber || m.license_number || item.licenseNumber || item.license_number || 'N/A',
              ownerName: m.ownerName || m.owner_name || item.ownerName || item.owner_name || 'N/A',
              pharmacistName: m.pharmacistName || m.pharmacist_name || item.pharmacistName || item.pharmacist_name || 'N/A'
            };
          });

        setMedicals(approvedList);
      } catch (error) {
        console.error("Failed to load approved medicals:", error);
        Swal.fire("Error", "Could not load medical data.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMedicals();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Medical Shop</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Owner Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">WhatsApp</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">License Number</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Pharmacist</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Linked Doctor</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading medical shops...</span>
                  </div>
                </td>
              </tr>
            ) : medicals.length > 0 ? (
              medicals.map((med, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  {/* Medical Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm border border-gray-200">
                        {med.medicalName?.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-3">
                        <span className="font-semibold text-gray-800 block">{med.medicalName}</span>
                        <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase truncate max-w-xs block">{med.types}</span>
                      </div>
                    </div>
                  </td>

                  {/* Owner Name */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                    {med.ownerName}
                  </td>

                  {/* WhatsApp */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                    {med.whatsappNumber}
                  </td>

                  {/* License */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-mono text-xs font-semibold">
                    {med.licenseNumber}
                  </td>

                  {/* Pharmacist */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                    {med.pharmacistName}
                  </td>

                  {/* Linked Doctor */}
                  <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                    <span className="font-semibold text-purple-700 block text-xs">{med.doctorName}</span>
                    <span className="text-[10px] text-gray-400 font-medium block truncate max-w-[150px]">{med.doctorHospital}</span>
                  </td>

                  {/* Address */}
                  <td className="px-6 py-4 text-gray-600 text-xs font-medium max-w-xs truncate" title={med.address}>
                    {med.address}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No approved medical shops found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ViewMedicals;
