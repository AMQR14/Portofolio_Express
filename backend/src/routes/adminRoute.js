const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { requireAdmin } = require('../middleware/adminAuth');

router.get('/profile', adminController.getProfile);
router.put('/profile', requireAdmin, adminController.updateProfile);
router.get('/admin/messages', requireAdmin, adminController.getAllMessages);
router.delete('/admin/messages/:id', requireAdmin, adminController.deleteMessage);

module.exports = router;
