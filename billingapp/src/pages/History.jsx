import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/history.css';
import axios from 'axios';
import Select from 'react-select';
import jsPDF from 'jspdf';
import 'jspdf-autotable';



const ViewHistory = () => {
  const navigate = useNavigate();

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [historySummary, setHistorySummary] = useState(null);
  const [customerList, setCustomerList] = useState([]);

  // Fetch customer list on load
  useEffect(() => {
    axios.get('http://localhost:5000/getCustomerNames')
      .then(res => setCustomerList(res.data))
      .catch(err => console.error('Error fetching customers:', err));
  }, []);

  // Reset history & summary when customer is deselected
  useEffect(() => {
    if (!selectedCustomer) {
      setFilteredHistory([]);
      setHistorySummary(null);
    }
  }, [selectedCustomer]);

  // Handle filter button click
  const handleFilter = async () => {
    if (!selectedCustomer) {
      alert("Please select a customer");
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/history/${selectedCustomer}`, {
        params: {
          from: fromDate,
          to: toDate
        }
      });

      setFilteredHistory(response.data.breakdown || []);
      setHistorySummary(response.data.summary || null);
    } catch (error) {
      console.error("Failed to fetch history:", error);
      alert("Error fetching history");
    }
  };


const generatePDF = () => {
  const doc = new jsPDF();

  doc.text('Customer Billing History', 14, 15);

  const tableColumn = ['Date', 'Items', 'Paid (₹)', 'Balance (₹)'];
  const tableRows = filteredHistory.map(record => [
    new Date(record.date).toLocaleDateString(),
    record.items,
    record.paid.toFixed(2),
    record.balance.toFixed(2)
  ]);

  doc.autoTable({
    startY: 25,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped'
  });

  // Add summary
  const totalPaid = filteredHistory.reduce((sum, r) => sum + r.paid, 0).toFixed(2);
  const totalBalance = filteredHistory.reduce((sum, r) => sum + r.balance, 0).toFixed(2);

  doc.text(`Total Paid: ₹${totalPaid}`, 14, doc.lastAutoTable.finalY + 10);
  doc.text(`Total Balance: ₹${totalBalance}`, 14, doc.lastAutoTable.finalY + 18);

  doc.save('Customer_History.pdf');
};



  return (
    <div className="view-history-container">
      <div className="top-bar">
        <button className="nav-btn" onClick={() => navigate('/')}>🏠 Home</button>
      </div>

      <h2>Customer Billing History</h2>

      <div className="filter-section">
        <label>Select Customer:</label>
        <Select
          options={customerList.map(c => ({
            label: `${c.name} (ID: ${c.id})`,
            value: c.id
          }))}
          value={customerList.find(c => c.id === selectedCustomer)
            ? {
              label: `${customerList.find(c => c.id === selectedCustomer)?.name} (ID: ${selectedCustomer})`,
              value: selectedCustomer
            }
            : null}
          onChange={(selected) => setSelectedCustomer(selected?.value || '')}
          placeholder="Search customer by name or ID"
          isSearchable
          styles={{
            container: (base) => ({
              ...base,
              width: '100%',
              maxWidth: '600px',
              marginBottom: '1rem'
            })
          }}
        />

        <label>From Date:</label>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />

        <label>To Date:</label>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

        <button className="filter-btn" onClick={handleFilter}>🔍 View History</button>
      </div>

      {filteredHistory.length > 0 && (
        <button className="pdf-btn" onClick={generatePDF}>
          📄 Export as PDF
        </button>
      )}

      {filteredHistory.length > 0 && (
        <>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Items Bought</th>
                <th>Total (₹)</th>
                <th>Amount Paid (₹)</th>
                <th>Balance Due (₹)</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((record, index) => (
                <tr key={index}>
                  <td>{new Date(record.date).toLocaleDateString('en-IN')}</td>
                  <td>{record.items}</td>
                  <td>{record.total.toFixed(2)}</td>
                  <td>{record.paid.toFixed(2)}</td>
                  <td>{record.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {historySummary && (
            <div className="summary-section">
              <h3>Summary</h3>
              <p><strong>Total Purchase:</strong> ₹{historySummary.totalPurchase.toFixed(2)}</p>
              <p><strong>Total Paid:</strong> ₹{historySummary.totalPaid.toFixed(2)}</p>
              <p><strong>Overdue / Balance:</strong> ₹{historySummary.overdue.toFixed(2)}</p>
              <p><strong>Total Transactions:</strong> {filteredHistory.length}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ViewHistory;
