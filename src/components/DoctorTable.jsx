// src/components/DoctorTable.jsx
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { FaCoins } from "react-icons/fa";
const DoctorTable = ({ doctors }) => {
  const navigate=useNavigate()
  console.log(doctors)
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Doctor</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Department</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Specialist</th>
              {/* <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Degree</th> */}
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Phone</th>
              {/* <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Social Media</th> */}
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Joining Date</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Action</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Fees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {doctors.length>0?doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                <td onClick={()=>navigate(`/settings/${doctor._id}/fees`)} className="px-6 py-4 whitespace-nowrap flex items-center cursor-pointer">
                  <img
                    src={doctor.profile_pic}
                    alt={doctor.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <span className="ml-3 font-medium text-gray-800">{doctor.name}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.department||'Cardiology'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.speciality}</td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.degree||"MBBS,MD"}</td> */}
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{doctor.phone}</td>
                {/* <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {doctor.socialMedia.join(', ')}
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">{moment(doctor.created_at).format("DD/MM/YYYY")}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-3">
                  <button onClick={()=>navigate('dr_form/'+doctor._id)} className="text-yellow-500 hover:text-yellow-700 transition-colors cursor-pointer">✎</button>
                  {/* <button className="text-red-500 hover:text-red-700 transition-colors cursor-pointer">✗</button> */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-3">
                  <button onClick={()=>navigate(`/settings/${doctor._id}/fees`)} className="text-[#2270C9] hover:text-blue-700 transition-colors cursor-pointer"><FaCoins /></button>
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

export default DoctorTable;