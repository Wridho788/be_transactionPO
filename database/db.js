const mysql = require('mysql');

const connection = mysql.createConnection({
  host: 'mysql-db-po-wridho246-e6c6.a.aivencloud.com',
  user: 'avnadmin', 
  database: 'defaultdb'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to the database');
});

module.exports = connection;
