import React, { useState, useEffect } from 'react';
import '../styles/AddStock.css';
import axios from 'axios';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom'; // ✅ Import navigation hook

const AddStock = () => {
  const [vegetableId, setVegetableId] = useState('');
  const [vegetableName, setVegetableName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [stockList, setStockList] = useState([]);
  const [vegetableList, setVegetableList] = useState([]);

  const navigate = useNavigate(); // ✅ React Router navigation

  useEffect(() => {
    axios.get('http://localhost:5000/getVegetables')
      .then(res => {
        const options = res.data.map(veg => ({
          value: veg.id,
          label: veg.name,
          name: veg.name
        }));
        setVegetableList(options);
      })
      .catch(err => console.error('Error fetching vegetables:', err));
  }, []);

  const handleAddStock = (e) => {
    e.preventDefault();
    if (!vegetableId || !vegetableName) return;

    const newStock = {
      vegetableId,
      vegetableName,
      quantity,
      unit
    };

    axios.post('http://localhost:5000/addStock', newStock)
      .then(res => {
        console.log('Stock added:', res.data);
        setStockList([...stockList, { ...newStock, date: new Date().toLocaleDateString() }]);
        setVegetableId('');
        setVegetableName('');
        setQuantity('');
        setUnit('kg');
      })
      .catch(err => console.error('Error saving stock:', err));
  };

  const handleSelectChange = (selectedOption) => {
    setVegetableId(selectedOption?.value || '');
    setVegetableName(selectedOption?.name || '');
  };

  return (
    <div className="add-stock-container">
      {/* ✅ Navigation buttons */}
        <div className="stock-buttons" style={{ marginTop: '20px' }}>
          <button type="button" onClick={() => navigate('/')}>🏠 Home</button>
          <button type="button" onClick={() => navigate('/viewStock')}>📦 View Available Stock</button>
        </div>
      <form className="add-stock-form" onSubmit={handleAddStock}>
        <h2>Add Stock</h2>

        <label>Vegetable</label>
        <Select
          options={vegetableList}
          value={vegetableList.find(v => v.value === vegetableId) || null}
          onChange={handleSelectChange}
          placeholder="Select Vegetable"
          isClearable
        />

        <label>Quantity</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
          required
          style={{ maxWidth: '120px' }} // ✅ Reduce input width
        />

        <label>Unit</label>
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          required
        >
          <option value="kg">Kg</option>
          <option value="box">Box</option>
          <option value="sack">Sack</option>
        </select>

        <button type="submit">Add to Stock</button>

        
      </form>

      {stockList.length > 0 && (
        <div className="stock-summary">
          <h3>Stock Added</h3>
          <ul>
            {stockList.map((stock, index) => (
              <li key={index}>
                {stock.vegetableName} - {stock.quantity} {stock.unit} (on {stock.date})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AddStock;
