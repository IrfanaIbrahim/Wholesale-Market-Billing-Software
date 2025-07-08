import express from 'express';
import cors from 'cors';
import mysql from 'mysql2';
import db from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Get all customers
app.get('/customers', async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*, 
        IFNULL(t.total_purchase, 0) AS total_purchase,
        IFNULL(p.total_paid, 0) AS total_paid,
        (IFNULL(t.total_purchase, 0) - IFNULL(p.total_paid, 0)) AS balance
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, SUM(total_amount) AS total_purchase
        FROM transactions
        GROUP BY customer_id
      ) t ON c.id = t.customer_id
      LEFT JOIN (
        SELECT customer_id, SUM(amount) AS total_paid
        FROM payments
        GROUP BY customer_id
      ) p ON c.id = p.customer_id
    `;

    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching customers with balances:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/getCustomerNames', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, name FROM customers');
    res.json(results);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).send('DB error');
  }
});


app.post('/customers', async (req, res) => {
  const { name, shopName, phone } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO customers (name, shop_name, phone) VALUES (?, ?, ?)',
      [name, shopName, phone]
    );
    res.json({ message: 'Customer added', id: result.insertId });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).send('Insert error');
  }
});



// Vegetables Part
app.post('/vegetables', async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO vegetables (name) VALUES (?)',
      [name]
    );
    res.json({ message: 'Vegetable added', id: result.insertId });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).send('Insert error');
  }
});

app.get('/getVegetableNames', async (req, res) => {
  try {
    const [results] = await db.query('SELECT name FROM vegetables');
    res.json(results);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).send('DB error');
  }
});

app.get('/getVegetables', async (req, res) => {
  try {
    const [results] = await db.query('SELECT id, name FROM vegetables ORDER BY id ASC');
    res.json(results);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).send('DB error');
  }
});

app.post('/addStock', async (req, res) => {
  const { vegetableId, vegetableName, quantity, unit } = req.body;

  if (!vegetableId || !vegetableName || !quantity || !unit) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  const currentDate = new Date().toISOString().split('T')[0];

  const query = `
    INSERT INTO stock (vegetable_id, vegetable_name, quantity, unit, date_added)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
  `;

  try {
    await db.query(query, [vegetableId, vegetableName, quantity, unit, currentDate]);
    res.status(200).json({ message: 'Stock updated successfully' });
  } catch (err) {
    console.error('Error adding stock:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/submitBill', async (req, res) => {
  const { customerId, paidNow, items } = req.body;

  if (!customerId || !items || items.length === 0) {
    return res.status(400).json({ error: 'Missing data' });
  }

  const totalAmount = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    for (const item of items) {
      const { vegetableId, quantity, unit, pricePerKg, total } = item;

      // 1. Insert into transactions (WITHOUT amount_paid)
      await connection.query(`
        INSERT INTO transactions (customer_id, vegetable_id, quantity, unit, price_per_unit, total_amount)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [customerId, vegetableId, quantity, unit, pricePerKg, total]);

      // // 2. Reduce stock
      // const [rows] = await connection.query(`
      //   SELECT quantity FROM stock WHERE vegetable_id = ? AND unit = ?
      // `, [vegetableId, unit]);

      // if (rows.length === 0 || rows[0].quantity < quantity) {
      //   throw new Error(`Not enough stock for vegetable ID ${vegetableId} in ${unit}`);
      // }

      // 2. Reduce stock
      console.log(`🔍 Checking stock for vegetable_id = ${vegetableId}, unit = ${unit}`);

      const [rows] = await connection.query(`
  SELECT quantity FROM stock WHERE vegetable_id = ? AND unit = ?
`, [vegetableId, unit]);

      console.log('🧾 Stock query result:', rows);

      if (rows.length === 0) {
        console.error(`❌ No stock entry found for vegetable ID ${vegetableId} with unit ${unit}`);
        throw new Error(`No stock found for vegetable ID ${vegetableId} in ${unit}`);
      }

      const availableQty = parseFloat(rows[0].quantity);
      console.log(`✅ Available quantity: ${availableQty}, Requested quantity: ${quantity}`);

      if (availableQty < quantity) {
        console.error(`❌ Not enough stock for vegetable ID ${vegetableId}. Available: ${availableQty}, Needed: ${quantity}`);
        throw new Error(`Not enough stock for vegetable ID ${vegetableId} in ${unit}`);
      }

      console.log(`🛒 Updating stock: Reducing ${quantity} from vegetable ID ${vegetableId}, unit: ${unit}`);

      await connection.query(`
  UPDATE stock SET quantity = quantity - ? WHERE vegetable_id = ? AND unit = ?
`, [quantity, vegetableId, unit]);
    }

    // 3. Insert into payments (ONCE per bill)
    if (parseFloat(paidNow) > 0) {
      await connection.query(`
        INSERT INTO payments (customer_id, amount)
        VALUES (?, ?)
      `, [customerId, parseFloat(paidNow)]);
    }

    await connection.commit();
    res.status(200).json({ message: 'Bill submitted successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Transaction failed:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});


app.post('/recordPayment', async (req, res) => {
  const { customerId, amount } = req.body;

  if (!customerId || !amount) {
    return res.status(400).json({ error: 'Missing customerId or amount' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO payments (customer_id, amount) VALUES (?, ?)',
      [customerId, amount]
    );
    res.json({ message: 'Payment recorded successfully', paymentId: result.insertId });
  } catch (err) {
    console.error('Error inserting payment:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/getCustomerOverdue/:customerId', async (req, res) => {
  const customerId = req.params.customerId;

  const totalPurchaseQuery = `
    SELECT COALESCE(SUM(total_amount), 0) AS total_purchase
    FROM transactions
    WHERE customer_id = ?
  `;

  const totalPaymentQuery = `
    SELECT COALESCE(SUM(amount), 0) AS total_paid
    FROM payments
    WHERE customer_id = ?
  `;

  try {
    const [purchaseResult] = await db.query(totalPurchaseQuery, [customerId]);
    const [paymentResult] = await db.query(totalPaymentQuery, [customerId]);

    const totalPurchase = parseFloat(purchaseResult[0].total_purchase) || 0;
    const totalPaid = parseFloat(paymentResult[0].total_paid) || 0;
    const overdue = totalPurchase - totalPaid;

    res.json({
      customerId,
      totalPurchase,
      totalPaid,
      overdue
    });
  } catch (err) {
    console.error('Error calculating customer overdue:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


app.get('/getStock', async (req, res) => {
  const query = `
    SELECT s.id, s.vegetable_id, s.vegetable_name, s.quantity, s.unit, s.date_added
    FROM stock s
    ORDER BY s.date_added DESC, s.vegetable_name ASC
  `;

  try {
    const [results] = await db.query(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching stock:', err);
    res.status(500).json({ error: 'Database error while fetching stock' });
  }
});


app.get('/api/history/:customerId', async (req, res) => {
  const { customerId } = req.params;
  const { from, to } = req.query;

  let dateFilter = "";
  const params = [customerId];

  if (from) {
    dateFilter += " AND DATE(t.date) >= ?";
    params.push(from);
  }

  if (to) {
    dateFilter += " AND DATE(t.date) <= ?";
    params.push(to);
  }

  const historyQuery = `
    SELECT 
      t.date,
      t.items,
      t.total,
      IFNULL(p.paid, 0) AS paid
    FROM (
      SELECT 
        DATE(t.date) AS date,
        GROUP_CONCAT(CONCAT(v.name, ' - ', t.quantity, t.unit) SEPARATOR ', ') AS items,
        SUM(t.total_amount) AS total
      FROM transactions t
      JOIN vegetables v ON t.vegetable_id = v.id
      WHERE t.customer_id = ?
      ${dateFilter}
      GROUP BY DATE(t.date)
    ) t
    LEFT JOIN (
      SELECT 
        DATE(payment_date) AS date,
        SUM(amount) AS paid
      FROM payments
      WHERE customer_id = ?
      GROUP BY DATE(payment_date)
    ) p ON t.date = p.date
    ORDER BY t.date ASC
  `;

  const totalPurchaseQuery = `
    SELECT COALESCE(SUM(total_amount), 0) AS total_purchase
    FROM transactions
    WHERE customer_id = ?
  `;

  const totalPaymentQuery = `
    SELECT COALESCE(SUM(amount), 0) AS total_paid
    FROM payments
    WHERE customer_id = ?
  `;

  try {
    // Query history breakdown
    const [historyRows] = await db.query(historyQuery, [...params, customerId]);

    const breakdown = historyRows.map(row => ({
      date: row.date,
      items: row.items,
      paid: parseFloat(row.paid),
      total: parseFloat(row.total),
      balance: parseFloat(row.total) - parseFloat(row.paid)
    }));

    // Get summary
    const [[purchaseResult]] = await db.query(totalPurchaseQuery, [customerId]);
    const [[paymentResult]] = await db.query(totalPaymentQuery, [customerId]);

    const totalPurchase = parseFloat(purchaseResult.total_purchase || 0);
    const totalPaid = parseFloat(paymentResult.total_paid || 0);
    const overdue = totalPurchase - totalPaid;

    res.json({
      summary: {
        totalPurchase,
        totalPaid,
        overdue
      },
      breakdown
    });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});



app.delete('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM customers WHERE id = ?', [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
