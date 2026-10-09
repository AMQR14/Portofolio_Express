const db = require("../config/db");

const getAllCertificates = (req, res) => {
  const query = "SELECT id, title, issuer, DATE_FORMAT(issued_date, '%Y-%m-%d') AS issued_date, credential_url, image, created_at FROM certificates ORDER BY issued_date DESC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Failed to retrieve certificates.", error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};

const createCertificate = (req, res) => {
  const { title, issuer, issued_date, credential_url, image } = req.body;
  if (!title || !issuer) return res.status(400).json({ success: false, message: "Title and issuer are required." });
  const query = "INSERT INTO certificates (title, issuer, issued_date, credential_url, image) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [title, issuer, issued_date || null, credential_url || null, image || null], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Failed to add certificate.", error: err.message });
    res.status(201).json({ success: true, message: "Certificate added successfully.", data: { id: result.insertId, title, issuer, issued_date, credential_url, image } });
  });
};

const updateCertificate = (req, res) => {
  const { id } = req.params;
  const { title, issuer, issued_date, credential_url, image } = req.body;
  if (!title || !issuer) return res.status(400).json({ success: false, message: "Title and issuer are required." });
  const query = "UPDATE certificates SET title = ?, issuer = ?, issued_date = ?, credential_url = ?, image = ? WHERE id = ?";
  db.query(query, [title, issuer, issued_date || null, credential_url || null, image || null, id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Failed to update certificate.", error: err.message });
    res.status(200).json({ success: true, message: "Certificate updated successfully.", data: { id: parseInt(id), title, issuer, issued_date, credential_url, image } });
  });
};

const deleteCertificate = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM certificates WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Failed to delete certificate.", error: err.message });
    res.status(200).json({ success: true, message: "Certificate deleted successfully." });
  });
};

module.exports = { getAllCertificates, createCertificate, updateCertificate, deleteCertificate };
