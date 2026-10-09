const express = require('express')
const router = express.Router()
const { requireAdmin } = require("../middleware/adminAuth");

const projectController = require('../controller/projectController')

router.get('/projects', projectController.getAllProject);
router.get('/projects/:id', projectController.getProjectById);
router.post('/projects', requireAdmin, projectController.createProject);
router.put('/projects/:id', requireAdmin, projectController.updateProject);
router.delete('/projects/:id', requireAdmin, projectController.deleteProject);

module.exports = router;