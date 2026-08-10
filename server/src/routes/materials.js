const express = require('express');
const router = express.Router();
const materialsController = require('../controllers/materials.controller');
const { auth, requireAdmin } = require('../middleware/auth');

router.get('/', auth, materialsController.list);
router.post('/', auth, requireAdmin, materialsController.create);
router.get('/rates', auth, materialsController.getSavedRates);
router.put('/rates/:material_id', auth, requireAdmin, materialsController.updateRate);
router.put('/:id', auth, requireAdmin, materialsController.update);

module.exports = router;
