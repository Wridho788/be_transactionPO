const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  database: 'db_po'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to the database');
});

module.exports = connection;
