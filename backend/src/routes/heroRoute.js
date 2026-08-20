const express = require('express');
const router = express.Router();

const heroController = require('../controller/heroController.js');

router.get('/hero', heroController.getHero);

module.exports = router;