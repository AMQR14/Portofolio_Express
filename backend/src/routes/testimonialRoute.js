const express = require('express');
const router = express.Router();
const testimonialController = require('../controller/testimonialController');
const { requireAdmin } = require('../middleware/adminAuth');

router.get('/testimonials', testimonialController.getAllTestimonials);
router.post('/testimonials', requireAdmin, testimonialController.createTestimonial);
router.put('/testimonials/:id', requireAdmin, testimonialController.updateTestimonial);
router.delete('/testimonials/:id', requireAdmin, testimonialController.deleteTestimonial);

module.exports = router;
