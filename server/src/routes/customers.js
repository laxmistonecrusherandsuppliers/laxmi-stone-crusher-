const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers.controller');
const { auth } = require('../middleware/auth');

router.get('/', auth, customersController.list);
router.post('/', auth, customersController.create);
router.get('/:id', auth, customersController.getById);
router.put('/:id', auth, customersController.update);
router.delete('/:id', auth, customersController.delete);
router.get('/:id/sales', auth, customersController.getSales);
router.get('/:id/ledger', auth, customersController.getLedger);

module.exports = router;
