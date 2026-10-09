const db = require("../config/db");

// Get profile (CV link, bio, avatar, etc.)
const getProfile = (req, res) => {
  const query = "SELECT * FROM profile LIMIT 1";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal mengambil profil", error: err.message });
    res.status(200).json({ success: true, data: results[0] || null });
  });
};

const updateProfile = (req, res) => {
  const { name, title, bio, cv_url, github_url, linkedin_url, email, avatar } = req.body;
  // Upsert: update if exists, insert if not
  const checkQuery = "SELECT id FROM profile LIMIT 1";
  db.query(checkQuery, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal memeriksa profil", error: err.message });
    if (results.length > 0) {
      const id = results[0].id;
      const query = "UPDATE profile SET name=?, title=?, bio=?, cv_url=?, github_url=?, linkedin_url=?, email=?, avatar=? WHERE id=?";
      db.query(query, [name, title, bio, cv_url, github_url, linkedin_url, email, avatar, id], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Gagal update profil", error: err.message });
        res.status(200).json({ success: true, message: "Profil berhasil diperbarui!" });
      });
    } else {
      const query = "INSERT INTO profile (name, title, bio, cv_url, github_url, linkedin_url, email, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      db.query(query, [name, title, bio, cv_url, github_url, linkedin_url, email, avatar], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Gagal membuat profil", error: err.message });
        res.status(201).json({ success: true, message: "Profil berhasil dibuat!", data: { id: result.insertId } });
      });
    }
  });
};

// Get all messages (admin view)
const getAllMessages = (req, res) => {
  const query = "SELECT * FROM messages ORDER BY created_at DESC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal mengambil pesan", error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};

const deleteMessage = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM messages WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal menghapus pesan", error: err.message });
    res.status(200).json({ success: true, message: "Pesan berhasil dihapus!" });
  });
};

module.exports = { getProfile, updateProfile, getAllMessages, deleteMessage };
