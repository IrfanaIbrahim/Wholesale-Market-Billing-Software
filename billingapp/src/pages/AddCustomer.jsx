// src/pages/AddCustomer.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AddCustomer.css';
import axios from 'axios';


const AddCustomer = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !shopName.trim()) {
      alert('Please fill all fields');
      return;
    }

    const newCustomer = { name, phone, shopName };

    // TODO: Send newCustomer to backend
    axios.post('http://localhost:5000/customers', newCustomer)
  .then(response => {
    alert("Customer Added Successfully!!!");
    console.log('Customer added:', response.data);
  })
  .catch(error => {
    console.error('Error adding customer:', error);
  });
    console.log('Customer Added:', newCustomer);

    // Reset form
    setName('');
    setPhone('');
    setShopName('');
  };

  return (
    <div className="add-customer-container">
      <div className="top-bar">
        <button className="nav-btn left" onClick={() => navigate('/')}>🏠 Home</button>
        <button className="nav-btn right" onClick={() => navigate('/viewCustomers')}>👥 View Customers</button>
      </div>

      <h2>Add New Customer</h2>

      <form onSubmit={handleSubmit} className="customer-form">
        <input
          type="text"
          placeholder="Customer Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="tel"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          type="text"
          placeholder="Shop Name"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />

        <button type="submit" className="submit-btn">➕ Add Customer</button>
      </form>
    </div>
  );
};

export default AddCustomer;
