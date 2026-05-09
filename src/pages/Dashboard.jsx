// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import useApi from '../api/useApi';

const Dashboard = () => {

  const{getData}=useApi()
  const [data, setdata] = useState({})

    // Fetch appointments
    useEffect(() => {
      const fetchdata = async () => {
        try {
          const res = await getData("/dashboard");
          console.log(res)
          setdata(res)
        } catch (error) {
          console.error("Failed to load data:", error);
          // Swal.fire("Error", "Could not Found", "error");
        }
      };
      fetchdata();
    }, []);
  // Reusable Stat Card Component for cleaner code
  const StatCard = ({ to, title, value, subtitle, color, icon }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block p-1 rounded-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-30 ${
          isActive ? 'focus:ring-blue-500' : 'focus:ring-gray-300'
        }`
      }
    >
      <div
        className={`bg-white p-6 rounded-lg shadow-md border border-gray-100 transition-all duration-200 hover:shadow-lg hover:border-${color}-200`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
            <p className={`mt-2 text-3xl font-bold text-${color}-600`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          </div>
          <div className={`text-4xl opacity-20 text-${color}-500`}>{icon}</div>
        </div>
      </div>
    </NavLink>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here’s an overview of your healthcare network.</p>
      </div>

      {/* Stats Grid */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          to="/hospitals"
          title="Hospitals"
          value={data?.hospitals?.count||"NA"}
          subtitle={`+${data?.hospitals?.new_this_month??"NA"} this month`}
          color="indigo"
          icon="🏥"
        />
        <StatCard
          to="/doctors"
          title="Doctors"
          value={data?.doctors?.count||"NA"}
          subtitle={`+${data?.doctors?.new_this_week??"NA"} this week`}
          color="blue"
          icon="👨‍⚕️"
        />
        <StatCard
          to="/appointments"
          title="Appointments"
          value={data?.appointments?.count||"NA"}
          subtitle={`Today: ${data?.appointments?.today??"NA"}`}
          color="green"
          icon="📅"
        />
        <StatCard
          to="/payments"
          title="Payments"
          value={data?.payments?.this_month||"NA"}
          subtitle="This Month"
          color="purple"
          icon="💵"
        />
      </div> */}

      {/* Main Content Grid */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> */}
        {/* Upcoming Appointments */}
        {/* <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upcoming Appointments</h2>
          <div className="space-y-4">
            {[
              { patient: 'John Doe', doctor: 'Dr. Sarah Lee', time: 'Today, 10:30 AM', status: 'Confirmed' },
              { patient: 'Emma Wilson', doctor: 'Dr. Raj Patel', time: 'Today, 1:15 PM', status: 'Pending' },
              { patient: 'Liam Carter', doctor: 'Dr. Anna Kim', time: 'Tomorrow, 9:00 AM', status: 'Confirmed' },
            ].map((apt, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-150 cursor-pointer transform"
                onClick={() => alert(`View details for ${apt.patient}`)} // Replace with real action
              >
                <div>
                  <p className="font-medium text-gray-800">{apt.patient}</p>
                  <p className="text-sm text-gray-500">with {apt.doctor}</p>
                  <p className="text-xs text-gray-400">{apt.time}</p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                    apt.status === 'Confirmed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {apt.status}
                </span>
              </div>
            ))}
          </div>
        </div> */}

        {/* Quick Actions */}
        {/* <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: 'Add New Hospital', icon: '🏥', color: 'indigo', to: '/hospitals/new' },
              { label: 'Register Doctor', icon: '👨‍⚕️', color: 'blue', to: '/doctors/new' },
              { label: 'Schedule Appointment', icon: '📅', color: 'green', to: '/appointments/new' },
              { label: 'View Payments', icon: '💵', color: 'purple', to: '/payments' },
              { label: 'Generate Report', icon: '📊', color: 'gray', to: '/reports' },
            ].map((action, i) => (
              <NavLink
                key={i}
                to={action.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-150 transform hover:scale-102 focus:outline-none focus:ring-2 focus:ring-${action.color}-300 ${
                    isActive
                      ? `bg-${action.color}-100 text-${action.color}-800 border border-${action.color}-200`
                      : `bg-${action.color}-50 text-${action.color}-700 hover:bg-${action.color}-100`
                  }`
                }
              >
                <span className="mr-3">{action.icon}</span>
                {action.label}
              </NavLink>
            ))}
          </div>
        </div> */}
      {/* </div> */}
    </div>
  );
};

export default Dashboard;