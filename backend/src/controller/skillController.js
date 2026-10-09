const db = require("../config/db");

const getAllSkills = (req, res) => {
  const query = "SELECT * FROM skills ORDER BY level DESC";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal mengambil skills", error: err.message });
    res.status(200).json({ success: true, data: results });
  });
};

const isValidSkillLevel = (level) => {
  const value = Number(level);
  return Number.isFinite(value) && value >= 0 && value <= 100;
};

const createSkill = (req, res) => {
  const { name, level, category } = req.body;
  if (!name || level === undefined || level === null || level === "") {
    return res.status(400).json({ success: false, message: "Name dan level wajib diisi" });
  }
  if (!isValidSkillLevel(level)) {
    return res.status(400).json({ success: false, message: "Level must be between 0 and 100" });
  }
  const query = "INSERT INTO skills (name, level, category) VALUES (?, ?, ?)";
  db.query(query, [name, Number(level), category || "Other"], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal menambahkan skill", error: err.message });
    res.status(201).json({ success: true, message: "Skill berhasil ditambahkan!", data: { id: result.insertId, name, level, category } });
  });
};

const updateSkill = (req, res) => {
  const { id } = req.params;
  const { name, level, category } = req.body;
  if (!name || level === undefined || level === null || level === "") {
    return res.status(400).json({ success: false, message: "Name dan level wajib diisi" });
  }
  if (!isValidSkillLevel(level)) {
    return res.status(400).json({ success: false, message: "Level must be between 0 and 100" });
  }
  const query = "UPDATE skills SET name = ?, level = ?, category = ? WHERE id = ?";
  db.query(query, [name, Number(level), category || "Other", id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal memperbarui skill", error: err.message });
    res.status(200).json({ success: true, message: "Skill berhasil diperbarui!", data: { id: parseInt(id), name, level, category } });
  });
};

const deleteSkill = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM skills WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Gagal menghapus skill", error: err.message });
    res.status(200).json({ success: true, message: `Skill berhasil dihapus!` });
  });
};

module.exports = { getAllSkills, createSkill, updateSkill, deleteSkill };
