const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { auth, requireAdmin } = require('../middleware/auth');

router.get('/', auth, settingsController.getAll);
router.put('/', auth, requireAdmin, settingsController.updateAll);

module.exports = router;
