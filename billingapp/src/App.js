// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import AddCustomer from './pages/AddCustomer';
import AddVegetable from './pages/AddVegetable';
import NewBill from './pages/NewBill';
import History from './pages/History';
import ViewCustomers from './pages/ViewCustomers'; 
import RecordPayment from './pages/RecordPayment';
import AddStock from './pages/AddStock';
import ViewVegetables from './pages/ViewVegetables';// create this file later
import ViewStock from './pages/ViewStock';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/addCustomer" element={<AddCustomer />} />
        <Route path="/addVegetable" element={<AddVegetable />} />
        <Route path="/newBill" element={<NewBill />} />
        <Route path="/history" element={<History />} />
        <Route path="/viewCustomers" element={<ViewCustomers />} />
        <Route path="/recordPayment" element={<RecordPayment />} />
        <Route path="/addStock" element={<AddStock />} />
        <Route path="/viewVegetables" element={<ViewVegetables />} />
        <Route path="/viewStock" element={<ViewStock />} />
      </Routes>
    </Router>
  );
}

export default App;
