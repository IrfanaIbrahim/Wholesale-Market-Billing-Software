// src/components/WelcomePage.jsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/welcome.css';

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <h1 className="title">Market Billing System</h1>
      <div className="button-grid">
        <button onClick={() => navigate('/addCustomer')} className="welcome-btn">➕ Add Customer</button>
        <button onClick={() => navigate('/addVegetable')} className="welcome-btn">🥬 Add Vegetable</button>
        <button onClick={() => navigate('/newBill')} className="welcome-btn">🧾 Add New Bill</button>
        <button onClick={() => navigate('/history')} className="welcome-btn">📜 View History</button>
        <button onClick={() => navigate('/recordPayment')} className="welcome-btn">💸 Record Payment</button>
        <button onClick={() => navigate('/addStock')} className="welcome-btn">🛒 Add Stock</button>

      </div>
    </div>
  );
};

export default WelcomePage;
