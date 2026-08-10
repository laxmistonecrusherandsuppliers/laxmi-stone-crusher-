const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { auth } = require('../middleware/auth');

router.get('/daily', auth, reportsController.daily);
router.get('/customer-wise', auth, reportsController.customerWise);
router.get('/material-wise', auth, reportsController.materialWise);
router.get('/due', auth, reportsController.dueReport);
router.get('/pdf', auth, reportsController.getPdf);

module.exports = router;
