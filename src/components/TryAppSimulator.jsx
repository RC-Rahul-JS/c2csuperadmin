import React, { useState } from 'react';

export default function TryAppSimulator({ 
  simScreen, 
  simUser, 
  simLocation, 
  changeSimScreen, 
  handleSimAutoLogin, 
  emitEvent,
  VIRTUAL_USERS,
  TRYAPP_DOCTORS,
  TRYAPP_MEDICINES
}) {
  const [simPendingDoc, setSimPendingDoc] = useState(null);
  const [simPendingMed, setSimPendingMed] = useState(null);

  // Common Header Component
  const Header = ({ title, showBack = true }) => (
    <div className="h-12 bg-indigo-600 flex items-center px-4 text-white shrink-0 shadow-md">
      {showBack && (
        <button onClick={() => changeSimScreen('HomeScreen', 'Back Header Icon')} className="text-xl font-bold mr-3">←</button>
      )}
      <h2 className="font-bold text-sm truncate flex-1">{title}</h2>
    </div>
  );

  const screens = {
    'LOGIN': (
      <div className="flex-1 p-4 bg-slate-50 flex flex-col justify-center space-y-4">
        <div className="text-center">
          <span className="text-3xl text-indigo-600 font-black">Care2Connect</span>
          <p className="text-slate-500 mt-1 text-xs">Superadmin Sandbox</p>
        </div>
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-slate-400 uppercase">Mock Profiles</span>
          {VIRTUAL_USERS.map(p => (
            <button key={p.id} onClick={() => handleSimAutoLogin(p)} className="w-full text-left p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-400 transition-all flex flex-col">
              <span className="font-bold">{p.name}</span>
              <span className="text-[9px] text-slate-500">{p.mobile} • {p.location}</span>
            </button>
          ))}
          <button onClick={() => changeSimScreen('SignUpDetail', 'Signup Button')} className="w-full mt-4 text-center text-xs text-indigo-600 font-bold">Create New Account</button>
        </div>
      </div>
    ),
    'SignUpDetail': (
      <div className="flex-1 bg-white flex flex-col">
        <Header title="Sign Up Details" showBack={false} />
        <div className="p-4 space-y-3">
          <div className="h-10 bg-slate-100 rounded-lg border border-slate-200"></div>
          <div className="h-10 bg-slate-100 rounded-lg border border-slate-200"></div>
          <button onClick={() => changeSimScreen('LOGIN', 'Complete Signup')} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-4">Register Account</button>
        </div>
      </div>
    ),
    'HomeScreen': (
      <div className="flex-1 bg-slate-50 overflow-y-auto">
        <div className="bg-indigo-600 p-4 pb-8 rounded-b-3xl">
          <div className="flex justify-between items-center mb-4 text-white">
            <div>
              <p className="text-[10px] opacity-80">Hello,</p>
              <h2 className="font-bold text-lg">{simUser?.name || 'Guest'}</h2>
            </div>
            <button onClick={() => changeSimScreen('LocationSelection', 'Location Pin')} className="bg-white/20 px-2 py-1 rounded text-[9px] backdrop-blur-md">
              📍 {simLocation} ▼
            </button>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm flex items-center">
            <span className="text-slate-400 text-xs">🔍 Search doctors, medicines...</span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-xs mb-3 text-slate-800">Services</h3>
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { id: 'FindDoctors', label: 'Doctors', icon: '👨‍⚕️' },
              { id: 'MedicineScreen', label: 'Pharmacy', icon: '💊' },
              { id: 'AppointmentHistory', label: 'Appts', icon: '📅' },
              { id: 'OnlineConsult', label: 'Consult', icon: '💻' }
            ].map(srv => (
              <button key={srv.id} onClick={() => changeSimScreen(srv.id, `Service: ${srv.label}`)} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-xl mb-1 border border-slate-100">{srv.icon}</div>
                <span className="text-[9px] font-bold text-slate-600">{srv.label}</span>
              </button>
            ))}
          </div>

          <h3 className="font-bold text-xs mb-3 text-slate-800">More Links</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'UserProfile', label: 'Profile' },
              { id: 'MedicationHistory', label: 'Med History' },
              { id: 'OrderTracking', label: 'Track Order' },
              { id: 'AboutCare2Connect', label: 'About Us' },
              { id: 'PrivacyPolicy', label: 'Privacy' },
              { id: 'HelpSupport', label: 'Support' }
            ].map(link => (
              <button key={link.id} onClick={() => changeSimScreen(link.id, `Menu: ${link.label}`)} className="bg-indigo-50 text-indigo-700 font-bold text-[9px] py-2 rounded-lg border border-indigo-100">
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
    'LocationSelection': (
      <div className="flex-1 bg-white">
        <Header title="Select Location" />
        <div className="p-4">
          {['Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Bhopal'].map(loc => (
            <button key={loc} onClick={() => { changeSimScreen('HomeScreen', `Selected Location: ${loc}`); }} className="w-full text-left p-3 mb-2 border-b border-slate-100 font-semibold text-sm hover:bg-slate-50">
              📍 {loc}
            </button>
          ))}
        </div>
      </div>
    ),
    'FindDoctors': (
      <div className="flex-1 bg-slate-50">
        <Header title="Find Specialists" />
        <div className="p-4 grid grid-cols-2 gap-3">
          {['Orthopedic', 'Cardiologist', 'Dentist', 'Pediatrician'].map(spec => (
            <button key={spec} onClick={() => changeSimScreen('DoctorsList', `Category: ${spec}`)} className="bg-white p-4 rounded-xl shadow-sm text-center border border-slate-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-full mx-auto mb-2"></div>
              <span className="font-bold text-xs text-slate-700">{spec}</span>
            </button>
          ))}
        </div>
      </div>
    ),
    'DoctorsList': (
      <div className="flex-1 bg-white">
        <Header title="Doctors Directory" />
        <div className="p-4">
          {TRYAPP_DOCTORS.map(doc => (
            <div key={doc.id} className="flex mb-4 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
              <div className="w-12 h-12 bg-slate-300 rounded-xl mr-3"></div>
              <div className="flex-1">
                <span className="font-bold text-xs block">{doc.name}</span>
                <span className="text-[9px] text-slate-500 block">{doc.spec}</span>
                <span className="text-[9px] text-indigo-600 font-bold block">₹{doc.fee}</span>
              </div>
              <button onClick={() => { setSimPendingDoc(doc); changeSimScreen('DoctorProfile', `View Profile: ${doc.name}`); }} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold text-[10px]">
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    ),
    'DoctorProfile': (
      <div className="flex-1 bg-white flex flex-col">
        <Header title="Doctor Profile" />
        {simPendingDoc && (
          <div className="p-4 overflow-y-auto flex-1">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-slate-300 rounded-2xl mr-4"></div>
              <div>
                <h2 className="text-lg font-bold">{simPendingDoc.name}</h2>
                <p className="text-xs text-slate-500">{simPendingDoc.spec}</p>
                <p className="text-xs text-slate-500">{simPendingDoc.experience} Exp</p>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
              <span className="text-xs font-bold block mb-1">About</span>
              <p className="text-[10px] text-slate-600 leading-relaxed">Dr. {simPendingDoc.name} is a highly skilled specialist at {simPendingDoc.hospital}. Highly recommended by patients with {simPendingDoc.likes} rating.</p>
            </div>
            <button onClick={() => changeSimScreen('AppointmentBooking', `Start Booking: ${simPendingDoc.name}`)} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs">
              Book Appointment (₹{simPendingDoc.fee})
            </button>
          </div>
        )}
      </div>
    ),
    'AppointmentBooking': (
      <div className="flex-1 bg-slate-50">
        <Header title="Select Slot" />
        <div className="p-4">
          <p className="text-xs font-bold mb-3">Available Timings</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {['10:00 AM', '11:30 AM', '02:00 PM', '04:15 PM'].map(slot => (
              <div key={slot} className="bg-white border border-slate-200 rounded-lg p-2 text-center text-[10px] font-bold text-slate-600">{slot}</div>
            ))}
          </div>
          <button onClick={() => changeSimScreen('Payments', 'Proceed to Payment (Booking)')} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs">
            Confirm & Pay
          </button>
        </div>
      </div>
    ),
    'OnlineConsult': (
      <div className="flex-1 bg-white">
        <Header title="Video Consultation" />
        <div className="p-4 flex flex-col items-center justify-center h-64">
          <div className="w-20 h-20 bg-indigo-100 rounded-full mb-4 flex items-center justify-center text-3xl">📹</div>
          <p className="font-bold text-sm mb-1">Connect with Doctors Online</p>
          <p className="text-xs text-slate-500 text-center mb-4">Instant video calls from anywhere.</p>
          <button onClick={() => changeSimScreen('FindDoctors', 'Start Online Consult')} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold text-xs">Find Doctors</button>
        </div>
      </div>
    ),
    'AppointmentHistory': (
      <div className="flex-1 bg-white">
        <Header title="My Appointments" />
        <div className="p-4">
          {[1,2].map(i => (
            <div key={i} className="mb-3 p-3 border border-slate-200 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-xs">Dr. Anurag Tiwari</span>
                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-bold px-2 py-1 rounded">COMPLETED</span>
              </div>
              <p className="text-[10px] text-slate-500">12th May 2026 • 10:00 AM</p>
              <button onClick={() => changeSimScreen('AppointmentDetails', `View Appt Details ${i}`)} className="text-[9px] text-indigo-600 font-bold mt-2">View Details &gt;</button>
            </div>
          ))}
        </div>
      </div>
    ),
    'AppointmentDetails': (
      <div className="flex-1 bg-slate-50">
        <Header title="Appointment Details" />
        <div className="p-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             <h3 className="font-bold text-sm mb-2">Prescription</h3>
             <div className="h-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-[10px] text-slate-400">PDF Document</div>
          </div>
        </div>
      </div>
    ),
    'MedicineScreen': (
      <div className="flex-1 bg-white">
        <Header title="Pharmacy" />
        <div className="p-4">
          <h3 className="font-bold text-xs mb-3 text-slate-800">Popular Medicines</h3>
          {TRYAPP_MEDICINES.map(med => (
             <div key={med.id} className="flex mb-3 items-center bg-slate-50 p-2 rounded-xl border border-slate-200">
               <div className="w-10 h-10 bg-rose-100 rounded-lg mr-3 flex items-center justify-center">💊</div>
               <div className="flex-1">
                 <span className="font-bold text-xs block">{med.name}</span>
                 <span className="text-[9px] text-slate-500 block">{med.category}</span>
               </div>
               <div className="text-right mr-3">
                 <span className="text-[10px] font-bold text-slate-800 block">₹{med.price}</span>
               </div>
               <button onClick={() => { setSimPendingMed(med); changeSimScreen('MedicationDetails', `View Med: ${med.name}`); }} className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold text-[10px]">
                 View
               </button>
             </div>
          ))}
        </div>
      </div>
    ),
    'MedicationDetails': (
      <div className="flex-1 bg-slate-50">
        <Header title="Medicine Details" />
        {simPendingMed && (
          <div className="p-4">
            <div className="h-32 bg-white rounded-xl mb-4 border border-slate-200 flex items-center justify-center text-4xl">💊</div>
            <h2 className="text-lg font-bold">{simPendingMed.name}</h2>
            <p className="text-xs text-slate-500 mb-2">{simPendingMed.category}</p>
            <p className="text-lg font-bold text-indigo-600 mb-4">₹{simPendingMed.price}</p>
            <p className="text-[10px] text-slate-600 mb-6">High quality medication sourced directly from verified manufacturers. Requires prescription for checkout.</p>
            <button onClick={() => changeSimScreen('Payments', `Buy Medicine: ${simPendingMed.name}`)} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs">
              Buy Now
            </button>
          </div>
        )}
      </div>
    ),
    'MedicationHistory': (
      <div className="flex-1 bg-white">
        <Header title="My Orders" />
        <div className="p-4 flex flex-col items-center mt-10">
           <span className="text-3xl mb-2">📦</span>
           <span className="font-bold text-xs">No Past Orders</span>
        </div>
      </div>
    ),
    'OrderTracking': (
      <div className="flex-1 bg-slate-50">
        <Header title="Track Order" />
        <div className="p-4">
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
              <span className="font-bold text-xs mb-3 block">Order #98231</span>
              <div className="border-l-2 border-indigo-500 pl-3 ml-2 space-y-4 py-2">
                 <div><span className="text-[10px] font-bold text-indigo-700">Order Placed</span></div>
                 <div><span className="text-[10px] font-bold text-slate-400">Out for Delivery</span></div>
              </div>
           </div>
        </div>
      </div>
    ),
    'UserProfile': (
      <div className="flex-1 bg-white">
        <Header title="My Profile" />
        <div className="p-4 flex flex-col items-center">
          <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${simUser?.avatarGrad} mb-3 shadow-md`}></div>
          <h2 className="font-bold text-lg">{simUser?.name}</h2>
          <p className="text-xs text-slate-500 mb-6">{simUser?.mobile}</p>
          
          <div className="w-full space-y-2">
            <button onClick={() => changeSimScreen('HomeScreen', 'Save Profile')} className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl font-bold text-xs text-left px-4">Edit Details</button>
            <button onClick={() => changeSimScreen('LOGIN', 'Logout')} className="w-full bg-rose-50 text-rose-600 py-3 rounded-xl font-bold text-xs text-left px-4 mt-8">Logout Account</button>
          </div>
        </div>
      </div>
    ),
    'AboutCare2Connect': (
      <div className="flex-1 bg-slate-50">
        <Header title="About Us" />
        <div className="p-5 text-center mt-10">
           <h2 className="text-xl font-black text-indigo-600 mb-2">Care2Connect</h2>
           <p className="text-xs text-slate-500 leading-relaxed">Bridging the gap between world-class doctors and patients through seamless digital healthcare.</p>
        </div>
      </div>
    ),
    'PrivacyPolicy': (
      <div className="flex-1 bg-white">
        <Header title="Privacy Policy" />
        <div className="p-4 overflow-y-auto h-[400px]">
           <h3 className="font-bold text-xs mb-2">Data Protection</h3>
           <p className="text-[9px] text-slate-600 leading-relaxed mb-4">Your medical records and personal telemetry are securely encrypted. We follow strict compliance protocols to ensure data privacy.</p>
           <h3 className="font-bold text-xs mb-2">Terms of Service</h3>
           <p className="text-[9px] text-slate-600 leading-relaxed">By using this application, you consent to our secure tracking modules designed to improve health outcomes.</p>
        </div>
      </div>
    ),
    'HelpSupport': (
      <div className="flex-1 bg-slate-50">
        <Header title="Support Chat" />
        <div className="p-4 flex flex-col h-[400px]">
           <div className="flex-1 bg-white rounded-xl border border-slate-200 p-3 mb-3 flex flex-col justify-end">
              <div className="bg-indigo-100 text-indigo-800 text-[10px] p-2 rounded-lg self-start max-w-[80%]">Hi! How can we help you today?</div>
           </div>
           <div className="flex gap-2">
             <div className="flex-1 h-10 bg-white border border-slate-200 rounded-full px-3 flex items-center text-[10px] text-slate-400">Type a message...</div>
             <button className="w-10 h-10 bg-indigo-600 rounded-full text-white font-bold text-xs flex items-center justify-center">➤</button>
           </div>
        </div>
      </div>
    ),
    'Payments': (
      <div className="flex-1 bg-white flex flex-col">
        <Header title="Checkout" />
        <div className="p-4 flex-1">
          <button onClick={() => changeSimScreen('HomeScreen', 'Abort Payment')} className="text-rose-500 font-bold text-[10px] mb-4">Cancel Transaction</button>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 shadow-sm">
            <h3 className="font-bold text-xs mb-2">Order Summary</h3>
            <div className="flex justify-between text-[10px] mb-1">
               <span className="text-slate-500">Subtotal</span>
               <span className="font-bold text-slate-700">₹{simPendingDoc?.fee || simPendingMed?.price || 0}</span>
            </div>
            <div className="flex justify-between text-[10px] mb-3">
               <span className="text-slate-500">Taxes & Fees</span>
               <span className="font-bold text-slate-700">₹20</span>
            </div>
            <div className="flex justify-between text-xs border-t border-slate-200 pt-2">
               <span className="font-bold">Total Amount</span>
               <span className="font-bold text-emerald-600">₹{(simPendingDoc?.fee || simPendingMed?.price || 0) + 20}</span>
            </div>
          </div>

          <button onClick={() => {
            const amount = (simPendingDoc?.fee || simPendingMed?.price || 0) + 20;
            emitEvent('PAYMENT', 'APP_PAYMENT', `Verified UPI settlement of ₹${amount} for ${simUser?.name}`, simUser, { screen: 'BookingSuccess', amount: amount, status: 'SUCCESS' });
            changeSimScreen('BookingSuccess', 'Confirm Secure Payment');
          }} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs shadow-md">
            Pay securely via UPI
          </button>
        </div>
      </div>
    ),
    'BookingSuccess': (
      <div className="flex-1 bg-emerald-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-500 rounded-full text-white flex items-center justify-center text-4xl mb-4 shadow-lg">✓</div>
        <h2 className="text-xl font-bold text-emerald-800 mb-2">Success!</h2>
        <p className="text-xs text-emerald-600 mb-8">Your transaction has been securely processed and confirmed.</p>
        <button onClick={() => changeSimScreen('HomeScreen', 'Return Home after Success')} className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold text-xs shadow-md">Back to Home</button>
      </div>
    )
  };

  return screens[simScreen] || screens['LOGIN'];
}
