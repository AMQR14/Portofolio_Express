/**
 * run-migrate.js
 * Run: node run-migrate.js
 * Executes migrate.sql against the configured database.
 *
 * Reads DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL from the
 * environment (or backend/.env). Defaults to the local database.
 */

require("dotenv").config();
const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3307),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_NAME || "portofolio_db",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  multipleStatements: true,
};

const db = mysql.createConnection(dbConfig);
const sqlFile = path.join(__dirname, "migrate.sql");
const sql = fs.readFileSync(sqlFile, "utf8");

db.connect((err) => {
  if (err) {
    console.error("❌ Could not connect to database:", err.message);
    process.exit(1);
  }
  console.log("✅ Connected to database:", dbConfig.database);

  db.query(sql, (err) => {
    if (err) {
      console.error("❌ Migration error:", err.message);
    } else {
      console.log("✅ Migration completed successfully!");
    }
    db.end();
  });
});
