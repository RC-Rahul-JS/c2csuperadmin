// // src/components/Sidebar.jsx
// import React from 'react';
// import { NavLink, useNavigate } from 'react-router-dom';
// import Cookies from 'js-cookie';

// const Sidebar = () => {
//   const navigate=useNavigate()
//   const navItems = ['Appointments','Hospitals', 'Doctors','Payments', 'Reports','Settings'];

//    const logout=()=>{
//     Cookies.remove('token');
//     navigate('/login');
//    }

//   return (
//     <aside className="w-64 bg-white shadow-lg p-5 h-full overflow-auto">
//       <div className="mb-8">
//         <h1 className="text-2xl font-bold text-purple-600">Care2Connect</h1>
//       </div>
//       <nav className="space-y-2">
//         {navItems.map((item) => (
//           <NavLink to={`/${item}`}
//             key={item}
//             className={({ isActive }) =>`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 ${
//               isActive
//                 ? 'bg-purple-100 text-purple-700 font-semibold'
//                 : 'text-gray-600 hover:bg-gray-100'
//             }`}
//           >
//             {item}
//           </NavLink>
//         ))}
//         <button onClick={logout} className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200">
//           Log Out
//         </button>
//       </nav>
//     </aside>
//   );
// };

// export default Sidebar;

// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import {
  HiCalendar,
  HiHome,
  HiOfficeBuilding,
  HiUserGroup,
  HiCreditCard,
  HiChartBar,
  HiCog,
  HiLogout,
  HiClipboardList,
  HiUsers,
  HiTerminal,
  HiDeviceMobile,
} from 'react-icons/hi';
import { MdAccountTree } from "react-icons/md";

const Sidebar = () => {
  const navigate = useNavigate();

  // Define nav items with icons and paths
  const navItems = [
    { name: 'Appointments', path: '/appointments', icon: HiCalendar },
    // { name: 'Hospitals', path: '/hospitals', icon: HiOfficeBuilding },
    { name: 'Doctors', path: '/doctors', icon: HiUserGroup },
    // { name: 'Staff', path: '/staff', icon: HiUserGroup },
    { name: 'Users', path: '/users', icon: HiUsers },
    { name: 'Medicine Orders', path: '/medicine-orders', icon: HiClipboardList },
    { name: 'Payments', path: '/payments', icon: HiCreditCard },
    { name: 'Accounting', path: '/accounting', icon: MdAccountTree  },
    { name: 'Reports', path: '/reports', icon: HiChartBar },
    { name: 'Monitoring', path: '/monitoring', icon: HiTerminal },
    { name: 'App Monitoring', path: '/app-monitoring', icon: HiDeviceMobile },
    // { name: 'Settings', path: '/settings', icon: HiCog },
    //  { name: "Designation", path: "/designation", icon: HiBriefcase },
  // { name: "Employee Creation", path: "/empcreation", icon: HiUserAdd },
  ];

  const logout = () => {
    Cookies.remove('token');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-white shadow-lg h-full flex flex-col border-r border-gray-200">
      {/* Logo Section */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">🩺</div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Care2Connect
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 transform ${
                  isActive
                    ? 'bg-purple-100 text-purple-800 font-semibold scale-102 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 opacity-80" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={logout}
          className="flex items-center w-full gap-3 px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-200 font-medium text-sm"
        >
          <HiLogout className="w-5 h-5" />
          Log Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;