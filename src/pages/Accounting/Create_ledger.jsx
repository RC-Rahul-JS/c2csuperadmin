// src/pages/LedgerManagement.jsx
import React, { useState,useEffect } from 'react';
import Swal from 'sweetalert2';
import useApi from '../../api/useApi';
import { showErrorAlert, showSuccessAlert } from '../../utils/alerts';

// Mock Data (replace with API later)


export default function LedgerManagement() {
    const { postData,getData } = useApi();
  const [formData, setFormData] = useState({
    grouptype: '',
    groupname: '',
    ledgername: '',
  });

  const [list, setList] = useState([]);
  const [grouplist,setgrouplist] = useState([]); // Simulate fetched data

  const fetchdata = async () => {
      try {
      const res = await getData("/accounting/groups");
      const res2 = await getData("/accounting/ledgers");
      console.log(res)
      if (Array.isArray(res)&& Array.isArray(res2)) {
          setgrouplist(res);
          setList(res2);
      } 
      } catch (error) {
      console.error("Failed to load Data:", error);
      showErrorAlert("Error", "Could not load Data. Please try again."); 
      }
  };
    useEffect(() => {
    fetchdata();
    }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset dependent fields when parent changes
    if (name === 'grouptype') {
      setFormData({ grouptype: value, groupname: '', ledgername: '' });
    } else if (name === 'groupname') {
      setFormData((prev) => ({ ...prev, [name]: value, ledgername: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async(e) => {
    e.preventDefault();
    const { grouptype, groupname, ledgername } = formData;
    if (!grouptype || !groupname || !ledgername.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Fields',
        text: 'Please fill all the fields to create a ledger.',
        confirmButtonText: 'Got it',
        confirmButtonColor: '#249CA2',
      });
      return;
    }

    // Prevent duplicates
    const exists = list.some((item) => item.LedgerName.toLowerCase() === ledgername.toLowerCase());
    if (exists) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate Ledger',
        text: `A ledger named "${ledgername}" already exists.`,
        confirmButtonText: 'Close',
      });
      return;
    }

     try {
        console.log(formData)
        await postData(`/accounting/ledgers`, formData);
        showSuccessAlert('Success!', formData._id?"Updated Successfully":'Created successfully');
        setFormData({ grouptype: '', groupname: '', ledgername: '' });// Reset form
        fetchdata()
        } catch (error) {
          console.error("Failed to save group:", error);
          showErrorAlert("Error", "Could not save. Please try again.");   
        }
  };

  // Handle Edit
  const handleEdit = (index) => {
    const item = list[index];
    setFormData({
      _id:item?._id,
      grouptype: item.GroupType,
      groupname: item.Group_id,
      ledgername: item.LedgerName,
    });

    Swal.fire({
      icon: 'info',
      title: 'Editing Mode',
      text: `Now editing: ${item.LedgerName}`,
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // Filtered groups based on selected type
  const filteredGroups = grouplist.filter((item) => item.GroupType === formData.grouptype);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      {/* Page Title */}
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">CREATE LEDGER</h2>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap gap-4 justify-between bg-gray-50 p-5 rounded-lg border border-gray-200 mb-8"
      >
        {/* Group Type */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Group Type</label>
          <select
            name="grouptype"
            value={formData.grouptype}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            {[
              { label: 'Income', id: 'Income' },
              { label: 'Assets', id: 'Assets' },
              { label: 'Expenditure', id: 'Expenditure' },
              { label: 'Liabilities', id: 'Liabilities' },
            ].map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Group Name (filtered by type) */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Group Name</label>
          <select
            name="groupname"
            value={formData.groupname}
            onChange={handleChange}
            disabled={!formData.grouptype}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !formData.grouptype ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          >
            <option value="">{formData.grouptype ? 'Select Group' : 'Choose type first'}</option>
            {filteredGroups.map((item) => (
              <option key={item._id} value={item._id}>
                {item.GroupName}
              </option>
            ))}
          </select>
        </div>

        {/* Ledger Name */}
        <div className="flex-1 min-w-[280px]">
          <label className="block font-semibold text-gray-700 mb-2">Ledger Name</label>
          <input
            type="text"
            name="ledgername"
            value={formData.ledgername}
            onChange={handleChange}
            placeholder="Enter ledger name"
            disabled={!formData.groupname}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !formData.groupname ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
        </div>

        {/* Submit Button */}
        <div className="w-full flex justify-center mt-4">
          <button
            type="submit"
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={!formData.grouptype || !formData.groupname || !formData.ledgername}
          >
            SUBMIT
          </button>
        </div>
      </form>

      {/* Ledger Table */}
      <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100 text-gray-800 uppercase text-sm">
              <th className="px-6 py-3 font-bold">S No</th>
              <th className="px-6 py-3 font-bold">Ledger Key</th>
              <th className="px-6 py-3 font-bold">Ledger Name</th>
              <th className="px-6 py-3 font-bold">Group Name</th>
              <th className="px-6 py-3 font-bold">Group Type</th>
              <th className="px-6 py-3 font-bold">Head Type</th>
              <th className="px-6 py-3 font-bold text-center">Edit</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {list.length > 0 ? (
              list.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 transition duration-100">
                  <td className="px-6 py-3 text-gray-700">{index + 1}</td>
                  <td className="px-6 py-3 text-gray-600 font-mono text-sm">{item.Code}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{item.LedgerName}</td>
                  <td className="px-6 py-3 text-gray-700">{item.GroupName}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full capitalize
                        ${item.GroupType === 'Income' && 'bg-green-100 text-green-800'}
                        ${item.GroupType === 'Assets' && 'bg-blue-100 text-blue-800'}
                        ${item.GroupType === 'Expenditure' && 'bg-orange-100 text-orange-800'}
                        ${item.GroupType === 'Liabilities' && 'bg-red-100 text-red-800'}
                      `}
                    >
                      {item.GroupType}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-600 font-medium">
                    {['Assets', 'Expenditure'].includes(item.GroupType) ? 'Dr' : 'Cr'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => handleEdit(index)}
                      className="text-blue-600 hover:text-blue-800 focus:outline-none"
                      aria-label={`Edit ${item.LedgerName}`}
                    >
                      <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No ledgers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}