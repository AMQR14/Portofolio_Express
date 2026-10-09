const db = require("../config/db");

const caseStudyFields = ["gallery", "challenge", "approach", "outcome"];

const validateCaseStudy = (body) => {
  const caseStudy = {};

  if (Object.prototype.hasOwnProperty.call(body, "gallery")) {
    if (
      !Array.isArray(body.gallery) ||
      body.gallery.length > 12 ||
      body.gallery.some(
        (url) => typeof url !== "string" || !url.trim() || url.length > 500,
      )
    ) {
      return { error: "Gallery must contain up to 12 valid image URLs." };
    }
    caseStudy.gallery = [...new Set(body.gallery.map((url) => url.trim()))];
  }

  for (const field of ["challenge", "approach", "outcome"]) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    if (typeof body[field] !== "string" || body[field].length > 5000) {
      return { error: `${field} must be text under 5,000 characters.` };
    }
    caseStudy[field] = body[field].trim() || null;
  }

  return { caseStudy };
};

const saveCaseStudy = (projectId, caseStudy, callback) => {
  const fields = caseStudyFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(caseStudy, field),
  );
  const columns = ["project_id", ...fields];
  const values = [
    projectId,
    ...fields.map((field) =>
      field === "gallery"
        ? JSON.stringify(caseStudy.gallery)
        : caseStudy[field],
    ),
  ];
  const updates = fields.map((field) => `${field} = VALUES(${field})`);
  const query = `INSERT INTO project_case_studies (${columns.join(", ")})
    VALUES (${columns.map(() => "?").join(", ")})
    ON DUPLICATE KEY UPDATE ${updates.join(", ")}`;

  db.query(query, values, callback);
};

const hasCaseStudyFields = (body) =>
  caseStudyFields.some((field) =>
    Object.prototype.hasOwnProperty.call(body, field),
  );

const attachCaseStudyData = (project) => {
  let gallery = [];
  if (project.gallery) {
    gallery =
      typeof project.gallery === "string"
        ? JSON.parse(project.gallery)
        : project.gallery;
  }
  if (
    !Array.isArray(gallery) ||
    gallery.some((image) => typeof image !== "string")
  ) {
    throw new Error("Stored project gallery has an invalid format.");
  }
  return { ...project, gallery };
};

const getAllProject = (req, res) => {
  const query = `
    SELECT projects.*, project_case_studies.gallery,
      project_case_studies.challenge, project_case_studies.approach,
      project_case_studies.outcome
    FROM projects
    LEFT JOIN project_case_studies
      ON project_case_studies.project_id = projects.id
    ORDER BY projects.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Gagal mengambil data proyek",
        error: err.message,
      });
    }

    try {
      const projects = results.map(attachCaseStudyData);
      res.status(200).json({
        success: true,
        message: "Berhasil mengambil semua proyek",
        data: projects,
      });
    } catch (parseError) {
      console.error("Unable to parse project gallery:", parseError);
      res.status(500).json({
        success: false,
        message: "Project gallery data is invalid.",
      });
    }
  });
};

const getProjectById = (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT projects.*, project_case_studies.gallery,
      project_case_studies.challenge, project_case_studies.approach,
      project_case_studies.outcome
    FROM projects
    LEFT JOIN project_case_studies
      ON project_case_studies.project_id = projects.id
    WHERE projects.id = ?
  `;

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

    try {
      const project = attachCaseStudyData(results[0]);
      res.status(200).json({
        success: true,
        message: "Berhasil mengambil data proyek",
        data: project,
      });
    } catch (parseError) {
      console.error("Unable to parse project gallery:", parseError);
      res.status(500).json({
        success: false,
        message: "Project gallery data is invalid.",
      });
    }
  });
};

const createProject = (req, res) => {
  const { title, description, image, category } = req.body;
  const { caseStudy, error: caseStudyError } = validateCaseStudy(req.body);

  if (caseStudyError) {
    return res.status(400).json({ success: false, message: caseStudyError });
  }

  if (!title || !image || !description) {
    return res.status(400).json({
      success: false,
      message: "Field title, image, atau description wajib diisi",
    });
  }

  const query = "INSERT INTO projects (title, category, description, image) VALUES (?, ?, ?, ?)";

  db.query(query, [title, category || null, description || null, image || null], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Gagal menambahkan proyek",
        error: err.message,
      });
    }

    const respond = () =>
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

    if (!hasCaseStudyFields(req.body)) return respond();
    saveCaseStudy(result.insertId, caseStudy, (caseStudyDbError) => {
      if (caseStudyDbError) {
        return res.status(500).json({
          success: false,
          message: "Project created, but case-study content could not be saved.",
          error: caseStudyDbError.message,
        });
      }
      respond();
    });
  });
};

const updateProject = (req, res) => {
  const { id } = req.params;
  const { title, description, image, category} = req.body;
  const { caseStudy, error: caseStudyError } = validateCaseStudy(req.body);

  if (caseStudyError) {
    return res.status(400).json({ success: false, message: caseStudyError });
  }

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

      const respond = () =>
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

      if (!hasCaseStudyFields(req.body)) return respond();
      saveCaseStudy(id, caseStudy, (caseStudyDbError) => {
        if (caseStudyDbError) {
          return res.status(500).json({
            success: false,
            message:
              "Project updated, but case-study content could not be saved.",
            error: caseStudyDbError.message,
          });
        }
        respond();
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