import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/ViewCustomers.css';

const ViewCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    axios.get('http://localhost:5000/customers')
      .then(res => {
        setCustomers(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Error fetching customers');
        setLoading(false);
      });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer and all transaction history?')) return;

    try {
      await axios.delete(`http://localhost:5000/customers/${id}`);
      // Remove deleted customer from UI
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Error deleting customer');
    }
  };

  return (
    <div className="view-customers-container">
      <div className="top-bar">
        <button className="nav-btn left" onClick={() => navigate('/')}>🏠 Home</button>
      </div>

      <h2>Registered Customers</h2>

      {loading && <p>Loading customers...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && (
        <table className="customers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Shop Name</th>
              <th>Phone</th>
              <th>Pending Balance (₹)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.shop_name}</td>
                <td>{customer.phone}</td>
                <td>{customer.balance ?? 0}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(customer.id)}
                  >
                    ❌ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewCustomers;
