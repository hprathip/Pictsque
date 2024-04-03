const express = require('express');
const controller = require('../controllers/mainController');
const router = express.Router();

router.get('/', controller.index);

router.get('/contact_us', controller.contact);

router.get('/about_us', controller.about);

module.exports = router;