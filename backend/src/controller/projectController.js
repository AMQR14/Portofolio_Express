const db = require("../config/db");

const getAllProject = (req, res) => {
  const query = "SELECT * FROM projects ORDER BY created_at DESC";

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data proyek",
        error: err.message,
      });
    }

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil semua proyek",
      data: results,
    });
  });
};

const getProjectById = (req, res) => {
  const { id } = req.params;
  const query = "SELECT * FROM projects WHERE id = ?";

  db.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data proyek",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Proyek dengan ID ${id} tidak ditemukan`,
      });
    }

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil data proyek",
      data: results[0],
    });
  });
};

const createProject = (req, res) => {
  const { title, description, image, category } = req.body;

  if (!title || !image || !description) {
    return res.status(400).json({
      success: false,
      message: "Field title, image, atau description wajib diisi",
    });
  }

  const query = "INSERT INTO projects (title, category, description, image) VALUES (?, ?, ?, ?)";

  db.query(query, [title, description || null, image || null, category || null], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Gagal menambahkan proyek",
        error: err.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "Proyek berhasil ditambahkan!",
      data: {
        id: result.insertId,
        title,
        category,
        description,
        image,
      },
    });
  });
};

const updateProject = (req, res) => {
  const { id } = req.params;
  const { title, description, image, category} = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: "Field title wajib diisi untuk melakukan update",
    });
  }

  const checkQuery = "SELECT * FROM projects WHERE id = ?";
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Gagal mendeteksi proyek",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Proyek dengan ID ${id} tidak ditemukan`,
      });
    }

    const updateQuery = "UPDATE projects SET title = ?, description = ?, image = ?, category = ? WHERE id = ?";
    db.query(updateQuery, [title, description || null, image || null, category || null, id], (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Gagal memperbarui proyek",
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: "Proyek berhasil diperbarui!",
        data: {
          id: parseInt(id),
          title,
          category,
          description,
          image,
        },
      });
    });
  });
};

const deleteProject = (req, res) => {
  const { id } = req.params;

  const checkQuery = "SELECT * FROM projects WHERE id = ?";
  db.query(checkQuery, [id], (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Gagal mendeteksi proyek",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Proyek dengan ID ${id} tidak ditemukan`,
      });
    }

    const deleteQuery = "DELETE FROM projects WHERE id = ?";
    db.query(deleteQuery, [id], (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Gagal menghapus proyek",
          error: err.message,
        });
      }

      res.status(200).json({
        success: true,
        message: `Proyek dengan ID ${id} berhasil dihapus!`,
      });
    });
  });
};

module.exports = {
  getAllProject,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};