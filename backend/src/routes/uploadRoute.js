const express = require("express");
const uploadController = require("../controller/uploadController");
const { requireAdmin } = require("../middleware/adminAuth");

const router = express.Router();
router.get("/download/:filename", uploadController.downloadResume);
router.post("/", requireAdmin, express.raw({ type: () => true, limit: "4mb" }), uploadController.uploadFile);

module.exports = router;
