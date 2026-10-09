const mysql = require("mysql2");

// A pool (not a single connection) so it survives serverless cold starts
// and idle disconnects. Defaults match the old local XAMPP/MySQL setup.
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "portofolio_db",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 5,
});

db.getConnection((err, connection) => {
  if (err) {
    console.log(err);
  } else {
    console.log("Database connected");
    connection.release();
  }
});

module.exports = db;
