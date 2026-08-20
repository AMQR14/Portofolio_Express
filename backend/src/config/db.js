const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    port: 3307,
    user: "root",
    password: "",
    database: "portofolio_db",
});


db.connect((err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Database connected');
    }
});

module.exports = db;