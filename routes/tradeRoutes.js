const express = require('express');
const controller = require('../controllers/tradeController');
const {isLoggedIn, isOwner} = require('../middlewares/auth');
const {validateId, validateResult, validateTrade} = require('../middlewares/validator');
const router = express.Router();

router.get('/', controller.trades);

router.get('/:id', validateId, controller.show);

router.get('/:id/edit', isLoggedIn, isOwner, validateId, controller.edit);

router.put('/:id', isLoggedIn, isOwner, validateId, validateResult, validateTrade, controller.update);

router.post('/:id/watch', validateId, isLoggedIn, controller.createWatchItem);

router.delete('/:id/watch', validateId, isLoggedIn, controller.deleteWatchItem);

router.delete('/:id', isLoggedIn, isOwner, validateId, controller.delete);

router.get('/trade/new', isLoggedIn, controller.new);

router.post('/', isLoggedIn, validateResult, validateTrade, controller.create);

router.put('/trade/:id', validateId, controller.updateTradeStatus);

module.exports = router;