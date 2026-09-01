const express = require('express')
const router = express.Router()

const projectController = require('../controller/projectController')

router.get('/projects', projectController.getAllProject);
router.get('/projects/:id', projectController.getProjectById);
router.post('/projects', projectController.createProject);
router.put('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

module.exports = router;