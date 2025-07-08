import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/ViewStock.css';
import { useNavigate } from 'react-router-dom';

const ViewStock = () => {
  const [stockList, setStockList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:5000/getStock')
      .then(res => setStockList(res.data))
      .catch(err => console.error('Error loading stock:', err));
  }, []);

  return (
    <div className="view-stock-container">
      <div className="view-stock-header">
        <h2>Available Stock</h2>
        <div className="view-stock-buttons">
          <button onClick={() => navigate('/')}>🏠 Home</button>
          <button onClick={() => navigate('/addStock')}>➕ Add Stock</button>
        </div>
      </div>

      {stockList.length === 0 ? (
        <p>No stock data available.</p>
      ) : (
        <table className="stock-table">
          <thead>
            <tr>
              <th>Vegetable</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Date Added</th>
            </tr>
          </thead>
          <tbody>
            {stockList.map((item, index) => (
              <tr key={index}>
                <td>{item.vegetable_name}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>{new Date(item.date_added).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ViewStock;
