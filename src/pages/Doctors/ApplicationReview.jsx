import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useApi from '../../api/useApi';
import { showSuccessAlert } from '../../utils/alerts';
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Sample application data
const applicationData = {
  _id: "6891b86cac76ad0e3a7a25ca",
  title: "Dr ShriRam Agarwal",
  fullName: "",
  phone: "",
  gender: "Male",
  city: "Narmadapuram",
  state: "Madhya Pradesh",
  clinicLocation: "Narmadapuram Near Bus stand",
  college: "Netaji Subhash Chandra Bose Medical College, Jabalpur",
  degree: "MD - Paediatrics",
  specialization: "Cardiologist",
  completionYear: "2002",
  registrationCouncil: "8745962314",
  registrationNumber: "875496589",
  registrationYear: "2005",
  experience: "20+",
  fees: "500",
  timings: "10 am - 2 pm",
  documents: {
    hospitalId: '6891b86bac76ad0e3a7a25c4',
    idProof: '6891b86bac76ad0e3a7a25c2',
    photo: '6891b86bac76ad0e3a7a25c5',
    registrationDoc: '6891b86bac76ad0e3a7a25c3'
  },
  created_at: "Tue, 05 Aug 2025 07:53:16 GMT"
};

const ApplicationReview = () => {
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applicationData, setapplicationData] = useState({});
  const {getData,postData}=useApi()
  const {id}=useParams()

   useEffect(() => {
    (async () => {
      try {
        const response = await getData('/doctor/onboard/'+id);
        console.log(response);
        setapplicationData(response)
      } catch (error) {
        console.log(error)
        // showErrorAlert("Failed", "Failed to Retrieve Doctors");
      }
    })();
  }, [id]);

  const handleApprove = async () => {
    setLoading(true);
    const data={
    name: applicationData.fullName||applicationData.title||'',
    email:applicationData.email|| '',
    phone:applicationData.phone|| '',
    state: applicationData.state||'',
    district:applicationData.district|| '',
    address: applicationData.clinicLocation||'',
    speciality: applicationData.degree||'',
    password:'',
    confirmPassword: '',
    phonenumberID:'',
    whatsAppBusinessAccountID: '',
    accessToken: '',
    ...applicationData
    }
    console.log(data)
    try {
      // Simulate API call
      const res=await postData('/doctor/onboard/'+id, {status:'Approved'});
      console.log(res)
      const res2= await postData('/doctors', data);
      console.log(res2)
      showSuccessAlert('Success!','Doctor Approved successfully');
      setApproved(true);
      alert("Doctor application approved successfully!");
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  const getFullName = () => {
    return applicationData.fullName || applicationData.title || "Unknown";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Doctor Application Review
      </h2>

      {/* Personal Info */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 border-blue-200">Personal Information</h3>
        <ul className="space-y-2 text-gray-700">
          <li><strong>Name:</strong> {getFullName()}</li>
          <li><strong>Gender:</strong> {applicationData.gender}</li>
          <li><strong>Phone:</strong> {applicationData.phone || "Not provided"}</li>
          <li><strong>Location:</strong> {applicationData.city}, {applicationData.state}</li>
          <li><strong>Clinic Address:</strong> {applicationData.clinicLocation}</li>
        </ul>
      </div>

      {/* Education */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 border-blue-200">Education & Qualification</h3>
        <ul className="space-y-2 text-gray-700">
          <li><strong>Degree:</strong> {applicationData.degree}</li>
          <li><strong>College:</strong> {applicationData.college}</li>
          <li><strong>Year of Completion:</strong> {applicationData.completionYear}</li>
        </ul>
      </div>

      {/* Professional Details */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 border-blue-200">Professional Details</h3>
        <ul className="space-y-2 text-gray-700">
          <li><strong>Specialization:</strong> {applicationData.specialization}</li>
          <li><strong>Registration Council:</strong> {applicationData.registrationCouncil}</li>
          <li><strong>Registration Number:</strong> {applicationData.registrationNumber}</li>
          <li><strong>Registration Year:</strong> {applicationData.registrationYear}</li>
          <li><strong>Experience:</strong> {applicationData.experience} years</li>
          <li><strong>Consultation Fees:</strong> ₹{applicationData.fees}</li>
          <li><strong>Available Timings:</strong> {applicationData.timings}</li>
        </ul>
      </div>

      {/* Documents */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 border-blue-200">Documents</h3>
        <ul className="space-y-2">
          <li>
            <a
              href={API_BASE_URL+`/image/${applicationData.documents?.idProof}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline hover:text-blue-800 transition"
            >
              🔍 View ID Proof
            </a>
          </li>
          <li>
            <a
              href={API_BASE_URL+`/image/${applicationData.documents?.hospitalId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline hover:text-blue-800 transition"
            >
              🏥 View Hospital ID
            </a>
          </li>
          <li>
            <a
              href={API_BASE_URL+`/image/${applicationData.documents?.photo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline hover:text-blue-800 transition"
            >
              📷 View Photo
            </a>
          </li>
          <li>
            <a
              href={API_BASE_URL+`/image/${applicationData.documents?.registrationDoc}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline hover:text-blue-800 transition"
            >
              📄 View Registration Document
            </a>
          </li>
        </ul>
      </div>

      {/* Application Date */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 border-blue-200">Submitted On</h3>
        <p className="text-gray-600">
          {new Date(applicationData.created_at).toLocaleString()}
        </p>
      </div>

      {/* Approval Action */}
      <div className="text-center mt-8">
        {!approved ? (
          <button
            onClick={handleApprove}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold text-white transition transform hover:scale-105 focus:outline-none ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 inline-block" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Approving...
              </>
            ) : (
              "✅ Approve Doctor"
            )}
          </button>
        ) : (
          <p className="text-green-600 font-semibold text-lg">✅ This doctor has been approved.</p>
        )}
      </div>
    </div>
  );
};

export default ApplicationReview;