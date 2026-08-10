const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const { auth } = require('../middleware/auth');

router.get('/', auth, salesController.list);
router.post('/', auth, salesController.create);
router.get('/stats/dashboard', auth, salesController.getDashboardStats);
router.get('/stats/recent', auth, salesController.getRecentSales);
router.get('/:id', auth, salesController.getById);
router.get('/:id/pdf', auth, salesController.getPdf);
router.post('/:id/payments', auth, salesController.addPayment);

module.exports = router;
