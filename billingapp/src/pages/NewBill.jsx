import React, { useState, useEffect } from 'react';
import '../styles/NewBill.css';
import axios from 'axios';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';


const NewBill = () => {
    const navigate = useNavigate();
  const [customerId, setCustomerId] = useState('');
  const [paidNow, setPaidNow] = useState('');
  const [submittedBill, setSubmittedBill] = useState(null);
  const [customerList, setCustomerList] = useState([]);
  const [vegetableList, setVegetableList] = useState([]);

  const [items, setItems] = useState([
    { vegetableId: '', vegName: '', quantity: '', unit: 'kg', pricePerKg: '', total: '' }
  ]);

  // Fetch customers
  useEffect(() => {
    axios.get('http://localhost:5000/getCustomerNames')
      .then(res => setCustomerList(res.data))
      .catch(err => console.error('Error fetching customers:', err));
  }, []);

  // Fetch vegetables with ID + name
  useEffect(() => {
    axios.get('http://localhost:5000/getVegetables')
      .then(res => {
        const options = res.data.map(v => ({
          label: v.name,
          value: v.id,
          name: v.name
        }));
        setVegetableList(options);
      })
      .catch(err => console.error('Error fetching vegetables:', err));
  }, []);

  const handleItemChange = (index, e) => {
    const newItems = [...items];
    newItems[index][e.target.name] = e.target.value;

    if (e.target.name === 'quantity' || e.target.name === 'pricePerKg') {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].pricePerKg) || 0;
      newItems[index].total = (qty * price).toFixed(2);
    }

    setItems(newItems);
  };

  const handleVegSelect = (selected, index) => {
    const newItems = [...items];
    newItems[index].vegetableId = selected?.value || '';
    newItems[index].vegName = selected?.name || '';
    setItems(newItems);
  };

  const addNewItem = () => {
    setItems([
      ...items,
      { vegetableId: '', vegName: '', quantity: '', unit: 'kg', pricePerKg: '', total: '' }
    ]);
  };

  const getTotalBill = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalAmount = parseFloat(getTotalBill());
    const paidAmount = parseFloat(paidNow) || 0;
    const overdue = (totalAmount - paidAmount).toFixed(2);

    const billData = {
      customerId,
      paidNow: paidAmount.toFixed(2),
      items
    };

    try {
      const response = await axios.post('http://localhost:5000/submitBill', billData);
      const { billId } = response.data;

      const submitted = {
        billId,
        customerId,
        customerName: customerList.find(c => c.id === customerId)?.name || '',
        items,
        totalAmount,
        paidNow: paidAmount.toFixed(2),
        overdue,
        date: new Date().toLocaleDateString()
      };

      setSubmittedBill(submitted);
      setCustomerId('');
      setPaidNow('');
      setItems([{ vegetableId: '', vegName: '', quantity: '', unit: 'kg', pricePerKg: '', total: '' }]);
    } catch (err) {
      console.error('Error submitting bill:', err);
      alert('Failed to submit bill. Please check stock and try again.');
    }
  };

  return (
    <><div className="top-bar">
      <button className="nav-btn left" onClick={() => navigate('/')}>🏠 Home</button>
    </div><div className="new-bill-container">
        <form className="new-bill-form" onSubmit={handleSubmit}>
          <h2>Create New Bill</h2>

          <label>Select Customer</label>
          <Select
            options={customerList.map(c => ({
              label: `${c.name} (ID: ${c.id})`,
              value: c.id
            }))}
            value={customerList.find(c => c.id === customerId)
              ? {
                label: `${customerList.find(c => c.id === customerId)?.name} (ID: ${customerId})`,
                value: customerId
              }
              : null}
            onChange={(selected) => setCustomerId(selected?.value || '')}
            placeholder="Search customer by name or ID"
            isSearchable
            styles={{ container: (base) => ({ ...base, width: '100%', maxWidth: '600px', marginBottom: '1rem' }) }} />

          <div className="items-section">
            <h3>Vegetable Items</h3>
            {items.map((item, index) => (
              <div key={index} className="item-row">
                <Select
                  options={vegetableList}
                  value={vegetableList.find(v => v.value === item.vegetableId) || null}
                  onChange={(selected) => handleVegSelect(selected, index)}
                  placeholder="Select vegetable"
                  isSearchable
                  styles={{ container: (base) => ({ ...base, width: '200px' }) }} />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, e)}
                  style={{ width: '80px' }}
                  required />
                <select
                  name="unit"
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, e)}
                >
                  <option value="kg">kg</option>
                  <option value="box">box</option>
                  <option value="sack">sack</option>
                  <option value="count">count</option>
                </select>
                <input
                  type="number"
                  name="pricePerKg"
                  placeholder="₹ per unit"
                  value={item.pricePerKg}
                  onChange={(e) => handleItemChange(index, e)}
                  required />
                <input
                  type="text"
                  name="total"
                  placeholder="Total ₹"
                  value={item.total}
                  disabled />
              </div>
            ))}
            <button type="button" onClick={addNewItem}>+ Add Item</button>
          </div>

          <div className="total-bill">
            <strong>Total: ₹ {getTotalBill()}</strong>
          </div>

          <label>Amount Paid Now (₹)</label>
          <input
            type="number"
            value={paidNow}
            onChange={(e) => setPaidNow(e.target.value)}
            placeholder="Enter paid amount" />

          <button type="submit">Submit Bill</button>
        </form>

        {submittedBill && (
          <div className="submitted-summary">
            <h3>Bill Summary</h3>
            <p><strong>Bill ID:</strong> {submittedBill.billId}</p>
            <p><strong>Customer:</strong> {submittedBill.customerName} (ID: {submittedBill.customerId})</p>
            <ul>
              {submittedBill.items.map((item, i) => (
                <li key={i}>
                  {item.quantity} {item.unit} of {item.vegName} @ ₹{item.pricePerKg}/{item.unit} = ₹{item.total}
                </li>
              ))}
            </ul>
            <p><strong>Total Amount:</strong> ₹{submittedBill.totalAmount}</p>
            <p><strong>Paid Now:</strong> ₹{submittedBill.paidNow}</p>
            <p><strong>Overdue:</strong> ₹{submittedBill.overdue}</p>
            <p><strong>Date:</strong> {submittedBill.date}</p>
          </div>
        )}
      </div></>
  );
};

export default NewBill;
