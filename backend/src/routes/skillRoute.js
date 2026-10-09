const express = require('express');
const router = express.Router();
const skillController = require('../controller/skillController');
const { requireAdmin } = require('../middleware/adminAuth');

router.get('/skills', skillController.getAllSkills);
router.post('/skills', requireAdmin, skillController.createSkill);
router.put('/skills/:id', requireAdmin, skillController.updateSkill);
router.delete('/skills/:id', requireAdmin, skillController.deleteSkill);

module.exports = router;
