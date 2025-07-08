import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/AddVegetable.css';

const AddVegetable = () => {
  const navigate = useNavigate();
  const [vegForm, setVegForm] = useState({ name: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setVegForm({ ...vegForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:5000/vegetables', vegForm);
      setMessage(`✅ ${res.data.message} (ID: ${res.data.id})`);
      setVegForm({ name: '' });
     
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to add vegetable. Check server connection.');
    }
  };

  return (
    <div className="add-veg-container">
      <div className="top-bar">
        <button className="nav-btn left" onClick={() => navigate('/')}>🏠 Home</button>
        <button className="nav-btn right" onClick={() => navigate('/viewVegetables')}>👥 View Vegetables</button>
      </div>
      <form className="add-veg-form" onSubmit={handleSubmit}>
        <h2>Add Vegetable</h2>

        <label htmlFor="name">Vegetable Name</label>
        <input
          type="text"
          id="name"
          name="name"
          value={vegForm.name}
          onChange={handleChange}
          placeholder="Enter Vegetable Name"
          required
        />

        <button type="submit">Add Vegetable</button>

        {message && <p className="response-message">{message}</p>}
      </form>
    </div>
  );
};

export default AddVegetable;
