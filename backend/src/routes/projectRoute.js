const express = require('express')
const router = express.Router()

const projectController = require('../controller/projectController')

router.get('/projects', projectController.getAllProject);
router.get('/projects/:id', projectController.getProjectById);

module.exports = router;