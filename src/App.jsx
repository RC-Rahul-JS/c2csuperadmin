
// src/App.jsx
import React from 'react';
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './Layout/Layout';
import Doctors from './pages/Doctors/Doctors';
import AddDoctor from'./pages/Doctors/AddDoctor';
import Register from './pages/Register';
import Login from './pages/Login';
import DateSetting from './pages/setting/DateSetting';
import Fees from './pages/setting/Fees';
import Slots from './pages/setting/Slots';
import CalendarWithTimeSlots from './pages/setting/CalendarWithTimeSlots';
import Tabs_layout from './Layout/Tabs_layout';
import { doctortabs, hospital_tabs, ledger_tabs, payments_tabs, setting_tabs, staff_tabs } from './utils/tabs';
import AddHospital from './pages/Hosiptals/AddHospital';
import ViewHospitals from './pages/Hosiptals/ViewHopitals';
import Applications from './pages/Doctors/Applications'
import ApplicationReview from './pages/Doctors/ApplicationReview';
import DoctorForm from './pages/Doctors/dr';
import DoctorList from './pages/Doctors/drlist';
import HospitalForm from './pages/Doctors/HospitalForm';
import HospitalList from './pages/Doctors/HospitalList';
import MedicalForm from './pages/Doctors/MedicalForm';
import MedicalList from './pages/Doctors/MedicalList';
import Appointment from './pages/Appointment/Appointment';
import Payments from './pages/Payments/Payments';
import Reports from './pages/Reports/Reports';
import Designation from './pages/Designation/Designation';
import EmpCreate from './pages/EmployeeCreate/EmpCreate';
import SetPassword from './pages/EmployeeCreate/ResetPass';
import JournalVoucher from './pages/EmployeeCreate/Jornal';
import Dashboard from './pages/Dashboard';
import View_ledger from './pages/Accounting/View_ledger';
import Create_group from './pages/Accounting/Create_group';
import Create_ledger from './pages/Accounting/Create_ledger';
import Vouchers from './pages/Payments/Vouchers';
import DoctorLedgerPage from './pages/Payments/DoctorLedgerPage';
import LedgerStatementPage from './pages/Payments/LedgerStatementPage';
import PaymentVoucherPage from './pages/Payments/PaymentVoucherPage';
import AppointmentPage from './pages/Payments/try';
import PaymentMultiple from './pages/Payments/PaymentMultiple';
import ExcelUploader from './pages/Payments/ExcelUploader';
import BankDetails from './pages/setting/BankDetails';
import FeeStructure from './pages/setting/FeeStructure';
import PaymentReq from './pages/Payments/PaymentReq';

import MedicineOrders from './pages/MedicineOrders/MedicineOrders';
import Users from './pages/Users/Users';
import Monitoring from './pages/Monitoring/Monitoring';
import AppMonitoring from './pages/Monitoring/AppMonitoring';
import AppAppearance from './pages/AppAppearance/AppAppearance';

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/login" element={<Login />} /> 
          <Route path="/" element={<Layout/>} >
            <Route path="/medicine-orders" element={<MedicineOrders />} />
            <Route path="/users" element={<Users />} />
            <Route path="/doctors" element={<Tabs_layout tabs={doctortabs} />} >
                <Route path="" element={<Doctors />} />
                <Route path="add" element={<AddDoctor />} />
                <Route path=":id/edit" element={<AddDoctor />} />
                <Route path="onboard_list" element={<Applications />} />
                <Route path="onboard_list/:id" element={<ApplicationReview />} />
                <Route path="fee_parameter" element={<FeeStructure />} />
                <Route path="dr_form" element={<DoctorForm />} />
                <Route path="dr_form/:id" element={<DoctorForm />} />
                <Route path="dr_list" element={<DoctorList />} />
                <Route path="hospital_form" element={<HospitalForm />} />
                <Route path="hospital_list" element={<HospitalList />} />
                <Route path="medical_form" element={<MedicalForm />} />
                <Route path="medical_list" element={<MedicalList />} />
            </Route>
            <Route path="/hospitals" element={<Tabs_layout tabs={hospital_tabs} />} >
                <Route path="" element={<ViewHospitals />} />
                <Route path="add" element={<AddHospital />} />
            </Route>
            {/* <Route path="/hospitals/:id" element={<Tabs_layout tabs={hospital_tabs} />} >
                <Route path="edit" element={<AddHospital />} />
            </Route> */}
            <Route path="/settings/:id" element={<Tabs_layout tabs={setting_tabs} />} >
                <Route path="date" element={<DateSetting/>} />
                <Route path="fees" element={<Fees/>} />
                <Route path="slots" element={<Slots/>} />
                <Route path="av" element={<CalendarWithTimeSlots/>} />
                <Route path="bank" element={<BankDetails/>} />
                <Route path="" element={<BankDetails/>} />
            </Route>
            <Route path="/accounting/" element={<Tabs_layout tabs={ledger_tabs} />} >
                {/* <Route path="" element={<View_ledger/>} /> */}
                <Route path="" element={<LedgerStatementPage />} />
                <Route path="vouchers" element={<Vouchers/>} />
                <Route path="create_group" element={<Create_group/>} />
                <Route path="create_ledger" element={<Create_ledger/>} />
            </Route>
            <Route path="/staff/" element={<Tabs_layout tabs={staff_tabs} />} >
                <Route path="" element={<EmpCreate/>} />
                <Route path="designation" element={<Designation/>} />
            </Route>
            <Route path="/payments/" element={<Tabs_layout tabs={payments_tabs} />} >
                {/* <Route path="" element={<Payments />} /> */}
                <Route path="" element={<PaymentMultiple />} />
                <Route path="doctor_ledger" element={<DoctorLedgerPage />} />
                <Route path="payment_voucher" element={<PaymentVoucherPage />} />
                <Route path="payment_voucher_multiple" element={<PaymentMultiple />} />
                <Route path="excel_uploader" element={<ExcelUploader />} />
                <Route path="payment_req" element={<PaymentReq />} />
            </Route>
          <Route path="/Reports" element={<Reports />} />
          <Route path="/appointments" element={<Appointment />} />
          <Route path="/register" element={<Register />} />
          <Route path="" element={<Dashboard/>} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/app-monitoring" element={<AppMonitoring />} />
          <Route path="/app-appearance" element={<AppAppearance />} />
 
 {/* NEwwwwwww*/}
{/*  
          <Route path="/designation" element={<Designation />} />
          <Route path="/empcreate" element={<EmpCreate />} /> */}
          <Route path="/setpassword" element={<SetPassword />} />
          <Route path="/journal_voucher" element={<JournalVoucher />} />
          <Route path="/try" element={<AppointmentPage />} />

              
 
 
 
          </Route>
        </Routes>
    </Router>
  );
}

export default App;
