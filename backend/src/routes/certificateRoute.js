const express = require('express');
const router = express.Router();
const certificateController = require('../controller/certificateController');
const { requireAdmin } = require('../middleware/adminAuth');

router.get('/certificates', certificateController.getAllCertificates);
router.post('/certificates', requireAdmin, certificateController.createCertificate);
router.put('/certificates/:id', requireAdmin, certificateController.updateCertificate);
router.delete('/certificates/:id', requireAdmin, certificateController.deleteCertificate);

module.exports = router;
