import mysql from 'mysql2/promise';

const db = await mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'irfuirfu',
  database: 'wholesale_billing',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


// db.connect((err) => {
//   if (err) {
//     console.error('MySQL connection error:', err);
//   } else {
//     console.log('MySQL connected ✅');
//   }
// });

export default db;
