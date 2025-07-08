import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/RecordPayment.css';

const RecordPayment = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [submittedPayment, setSubmittedPayment] = useState(null);
  const [customerOverdue, setCustomerOverdue] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/getCustomerNames')
      .then(res => setCustomers(res.data))
      .catch(err => console.error('Error fetching customers:', err));
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerOverdue(null);
      return;
    }

    axios.get(`http://localhost:5000/getCustomerOverdue/${selectedCustomerId}`)
      .then(res => setCustomerOverdue(res.data.overdue))
      .catch(err => {
        console.error('Error fetching overdue amount:', err);
        setCustomerOverdue(null);
      });
  }, [selectedCustomerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId || !amountPaid) return;

    try {
      await axios.post('http://localhost:5000/recordPayment', {
        customerId: selectedCustomerId,
        amount: Number(amountPaid),
      });

      const customer = customers.find(c => c.id.toString() === selectedCustomerId.toString());

      const previousOverdue = customerOverdue;
      const newOverdue = Math.max(previousOverdue - Number(amountPaid), 0);

      setSubmittedPayment({
        customerId: customer.id,
        customerName: customer.name,
        paidAmount: Number(amountPaid),
        date: new Date().toLocaleDateString(),
        previousOverdue,
        newOverdue
      });

      setAmountPaid('');

      // Refresh overdue after payment
      axios.get(`http://localhost:5000/getCustomerOverdue/${selectedCustomerId}`)
        .then(res => setCustomerOverdue(res.data.overdue))
        .catch(err => {
          console.error('Error fetching overdue after payment:', err);
          setCustomerOverdue(null);
        });

    } catch (err) {
      console.error('Error recording payment:', err);
      alert('Failed to record payment');
    }
  };

  return (
          <><h2 className="heading">Record Payment (No Purchase)</h2>
          <div className="record-payment-container">

      <form onSubmit={handleSubmit} className="payment-form">
        <label>Select Customer:</label>
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          required
        >
          <option value="">-- Choose Customer --</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} (ID: {c.id})
            </option>
          ))}
        </select>

        {customerOverdue !== null && (
          <p className="balance-info">
            Current Overdue: ₹{customerOverdue.toFixed(2)}
          </p>
        )}

        <label>Amount Paid:</label>
        <input
          type="number"
          placeholder="Enter amount"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          required />

        <button type="submit">Record Payment</button>
      </form>

      {submittedPayment && (
        <div className="payment-summary">
          <h3>Payment Summary</h3>
          <p><strong>Customer:</strong> {submittedPayment.customerName} (ID: {submittedPayment.customerId})</p>
          <p><strong>Paid:</strong> ₹{submittedPayment.paidAmount.toFixed(2)}</p>
          <p><strong>Previous Overdue:</strong> ₹{submittedPayment.previousOverdue.toFixed(2)}</p>
          <p><strong>New Overdue:</strong> ₹{submittedPayment.newOverdue.toFixed(2)}</p>
          <p><strong>Date:</strong> {submittedPayment.date}</p>
          <p><em>{submittedPayment.message}</em></p>
        </div>
      )}
    </div></>
  );
};

export default RecordPayment;
