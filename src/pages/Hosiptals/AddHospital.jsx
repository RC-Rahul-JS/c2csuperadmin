import React, { useState } from "react";
import Swal from 'sweetalert2';
import useApi from "../../api/useApi";
import { useParams } from "react-router-dom";

const AddHospital = () => {
   const {id}=useParams();
  const { postData,getData } = useApi();

  // Form state
  const [hospitalName, setHospitalName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!hospitalName || !address || !city || !state || !pincode || !phone) {
      Swal.fire("Error!", "Please fill all required fields.", "error");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      Swal.fire("Error!", "Phone number must be 10 digits.", "error");
      return;
    }

    if (!/^\d{6}$/.test(pincode)) {
      Swal.fire("Error!", "Pincode must be 6 digits.", "error");
      return;
    }

    const hospitalData = {
      hospital_name: hospitalName,
      address,
      city,
      state,
      pincode,
      contact_person: contactPerson,
      phone,
      email: email || null,
      license_number: licenseNumber,
      established_year: establishedYear,
    };

    // Confirmation dialog
    Swal.fire({
      title: "Add Hospital?",
      html: `
        <p><strong>Hospital:</strong> ${hospitalName}</p>
        <p><strong>Location:</strong> ${city}, ${state}</p>
        <p><strong>Contact:</strong> ${contactPerson || "N/A"}</p>
        <p>Are you sure you want to add this hospital?</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#007bff",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, Add Hospital",
      cancelButtonText: "Cancel",
      width: "400px",
      backdrop: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await postData("/hospitals/create", hospitalData);
          
          Swal.fire({
            title: "Success!",
            text: `${hospitalName} has been added successfully.`,
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          });

          // Reset form
          setHospitalName("");
          setAddress("");
          setCity("");
          setState("");
          setPincode("");
          setContactPerson("");
          setPhone("");
          setEmail("");
          setLicenseNumber("");
          setEstablishedYear("");
        } catch (error) {
          Swal.fire("Error!", "Failed to add hospital. Please try again.", "error");
          console.error("Add hospital error:", error);
        }
      }
    });
  };

  if(id){
      useEffect(() => {
        // Fetch doctor data if id is provided
        const fetchHospitalData = async () => {
          try {
            const response = await getData(`/admin/doctors/${id}`);
            let formData = response.data;
            setHospitalName(formData.hospital_name || "");
            setAddress(formData.address || "");
            setCity(formData.city || "");
            setState(formData.state || "");
            setPincode(formData.pincode || "");
            setContactPerson(formData.contact_person || "");
            setPhone(formData.phone || "");
            setEmail(formData.email || "");
            setLicenseNumber(formData.license_number || "");
            setEstablishedYear(formData.established_year || "");
            
          } catch (error) {
            console.error('Failed to fetch doctor data:', error);
            showErrorAlert('Error', 'Failed to fetch doctor data');
          }
        };
        fetchHospitalData();
      }, []);
    }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 px-6 py-10">
      {/* Main Form Card */}
      <div className="w-full max-w-4xl bg-white border border-gray-300 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Add New Hospital</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hospital Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Hospital Name *</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="e.g., City Multi-Specialty Hospital"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">License Number</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Full Address *</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g., 123 Health Avenue, Medical District"
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* City & State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">City *</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Pune"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">State *</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., Maharashtra"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>
          </div>

          {/* Pincode & Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Pincode *</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="6-digit code"
                maxLength="6"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Established Year</label>
              <input
                type="number"
                value={establishedYear}
                onChange={(e) => setEstablishedYear(e.target.value)}
                placeholder="e.g., 2010"
                min="1900"
                max={new Date().getFullYear()}
                className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g., Dr. Anil Kumar"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit number"
                maxLength="10"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@hospital.com"
                className="w-full px-4 py-2.5 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-center">
            <button
              type="submit"
               className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Add Hospital
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHospital;