
// src/pages/AddDoctor.jsx
import React, { useEffect, useState } from 'react';
import useApi from '../../api/useApi';
import { showSuccessAlert, showErrorAlert } from '../../utils/alerts';
import { useNavigate, useParams } from 'react-router-dom';

const AddDoctor = () => {
  const {id}=useParams();
  const { postData,getData } = useApi();
  const Navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    state: '',
    district: '',
    address: '',
    speciality: '',
    experience: '',
    password: '',
    confirmPassword: '',
    phonenumberID: '',
    whatsAppBusinessAccountID: '',
    accessToken: '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState('');


  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

 const uploadImage = async (img) => {
  try {
    // Create FormData to send file as multipart/form-data
    const formData = new FormData();
    formData.append("file", img); // Ensure field name matches Flask API

    // Make POST request
    const res = await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Failed to upload: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Upload successful:", data);
    return data; // contains message and file_id

  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};


  const handleImageChange = async(e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadImage(file)  
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setFormData((prev) => ({ ...prev, imageUrl: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const validationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.name) validationErrors.name = 'Name is required';
    if (!formData.email || !emailRegex.test(formData.email))
      validationErrors.email = 'Valid email is required';
    if (!formData.phone || !phoneRegex.test(formData.phone))
      validationErrors.phone = '10-digit phone number is required';
    if (!formData.state) validationErrors.state = 'State is required';
    if (!formData.district) validationErrors.district = 'District is required';
    if (!formData.address) validationErrors.address = 'Address is required';
    if (!formData.speciality) validationErrors.speciality = 'Speciality is required';
    if (!formData.experience) validationErrors.experience = 'Experience is required';
    if (!formData.password || formData.password.length < 6)
      validationErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)
      validationErrors.confirmPassword = 'Passwords do not match';

    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // Send to backend
      await postData(id?`/doctors/${id}`:'/doctors', formData);
      showSuccessAlert('Success!', id?"Doctor Updated Successfully":'Doctor added successfully');
      id&&Navigate(`/doctors`);
      setFormData({
        name: '',
        email: '',  
        phone: '',
        state: '',
        district: '',
        address: '',
        speciality: '',
        experience: '',
        password: '',
        confirmPassword: '',
        phonenumberID: '',
        whatsAppBusinessAccountID: '',
        accessToken: '',
        imageUrl: '',
      });
      setImagePreview('');
      setErrors({});
    } catch (err) {
      // showErrorAlert('Error', 'Failed to add doctor. Please try again.');
    }
  };

  if(id){
    useEffect(() => {
      // Fetch doctor data if id is provided
      const fetchDoctorData = async () => {
        try {
          const response = await getData(`/admin/doctors/${id}`);
          setFormData(response);
          setImagePreview(response.imageUrl);
        } catch (error) {
          console.error('Failed to fetch doctor data:', error);
          showErrorAlert('Error', 'Failed to fetch doctor data');
        }
      };
      fetchDoctorData();
    }, []);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
          </div>

          {/* Address Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.district ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
              <input
                type="number"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.experience ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.experience && <p className="text-red-500 text-sm mt-1">{errors.experience}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="3"
            />
            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
          </div>

          {/* Speciality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Speciality</label>
            <input
              type="text"
              name="speciality"
              value={formData.speciality}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.speciality ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.speciality && <p className="text-red-500 text-sm mt-1">{errors.speciality}</p>}
          </div>

          {/* Password Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* WhatsApp Business Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
              <input
                type="text"
                name="phonenumberID"
                value={formData.phonenumberID}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Business Account ID</label>
              <input
                type="text"
                name="whatsAppBusinessAccountID"
                value={formData.whatsAppBusinessAccountID}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
              <input
                type="text"
                name="accessToken"
                value={formData.accessToken}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full"
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="mt-2 w-24 h-24 object-cover rounded-full border"
              />
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              SUBMIT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDoctor;