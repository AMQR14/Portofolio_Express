const db = require("../config/db");

const getValidatedRating = (rating) => {
  if (rating === undefined || rating === null || rating === "") return 5;
  const parsedRating = Number(rating);
  return Number.isInteger(parsedRating) && parsedRating >= 1 && parsedRating <= 5
    ? parsedRating
    : null;
};

const getAllTestimonials = (req, res) => {
  const query = "SELECT * FROM testimonials ORDER BY created_at DESC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal mengambil testimoni", error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};

const createTestimonial = (req, res) => {
  const { name, role, company, content, avatar, rating } = req.body;
  if (!name || !content) return res.status(400).json({ success: false, message: "Name dan content wajib diisi" });
  const validatedRating = getValidatedRating(rating);
  if (validatedRating === null) return res.status(400).json({ success: false, message: "Rating must be a whole number from 1 to 5" });
  const query = "INSERT INTO testimonials (name, role, company, content, avatar, rating) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(query, [name, role || null, company || null, content, avatar || null, validatedRating], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal menambahkan testimoni", error: err.message });
    res.status(201).json({ success: true, message: "Testimoni berhasil ditambahkan!", data: { id: result.insertId, name, role, company, content, avatar, rating: validatedRating } });
  });
};

const updateTestimonial = (req, res) => {
  const { id } = req.params;
  const { name, role, company, content, avatar, rating } = req.body;
  if (!name || !content) return res.status(400).json({ success: false, message: "Name dan content wajib diisi" });
  const validatedRating = getValidatedRating(rating);
  if (validatedRating === null) return res.status(400).json({ success: false, message: "Rating must be a whole number from 1 to 5" });
  const query = "UPDATE testimonials SET name = ?, role = ?, company = ?, content = ?, avatar = ?, rating = ? WHERE id = ?";
  db.query(query, [name, role || null, company || null, content, avatar || null, validatedRating, id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal memperbarui testimoni", error: err.message });
    res.status(200).json({ success: true, message: "Testimoni berhasil diperbarui!" });
  });
};

const deleteTestimonial = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM testimonials WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal menghapus testimoni", error: err.message });
    res.status(200).json({ success: true, message: "Testimoni berhasil dihapus!" });
  });
};

module.exports = { getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
