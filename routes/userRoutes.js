const express = require('express');
const controller = require('../controllers/userController');
const { isLoggedIn, isGuest } = require('../middlewares/auth');
const { validateId, validateLogIn, validateResult } = require('../middlewares/validator');
const { logInLimiter } = require('../middlewares/rateLimiter');

const router = express.Router();

//GET /users/new: send html form for creating a new user
router.get('/new', isGuest, controller.new);

//POST /users: create a new user
router.post('/', isGuest, logInLimiter, validateLogIn, validateResult, controller.create);

//GET /users/login: send html form for user login
router.get('/login', isGuest, controller.getUserLogin);

//POST /users: authenticates the user
router.post('/login', isGuest, controller.login);

//GET /users/profile: show details of the user
router.get('/profile', isLoggedIn, controller.profile);

//GET /users/logout: logout the user
router.get('/logout', isLoggedIn, controller.logout);

router.get('/trade/:id', isLoggedIn, validateId, controller.ownItems);

router.post('/trade/:id', isLoggedIn, validateId, controller.makeOffer);

// router.delete('/trade/offer/:id', isLoggedIn, validateId, controller.cancelOffer);

// router.delete('/trade/offer/:id/accept', isLoggedIn, validateId, controller.acceptOffer);

// router.get('/trade/offer/:id', isLoggedIn, validateId, controller.viewOffer);

router.get('/trade/offer/:id', isLoggedIn, controller.offer);

router.get('/trade/ownoffer/:id', isLoggedIn, controller.ownOffer);

router.put('/trade/offer/cancel/:id', isLoggedIn, controller.cancelOffer1);

router.put('/trade/offer/accept/:id', isLoggedIn, controller.acceptOffer1);

module.exports = router;