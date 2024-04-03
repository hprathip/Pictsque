const { validationResult } = require('express-validator');
const { body } = require('express-validator');

exports.validateId = (req, res, next) => {
    let id = req.params.id;
    //an objectId is a 24-bit Hex string
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
        return next();
    } else {
        let err = new Error('Invalid trade id');
        err.status = 400;
        return next(err);
    }
};

exports.validateSignUp = [body('firstName', 'First name cannot be empty').notEmpty().trim().escape(),
body('lastName', 'Last name cannot be empty').notEmpty().trim().escape(),
body('email', 'Email must be a valid email address').notEmpty().isEmail().trim().escape().normalizeEmail(),
body('password', 'Password must be at least 8 characters and at most 64 charaters').isLength({ min: 8, max: 64 }).notEmpty().trim()];

exports.validateLogIn = [body('email', 'Email must be a valid email address').notEmpty().isEmail().trim().escape().normalizeEmail(),
body('password', 'Password must be at least 8 characters and at most 64 charaters').isLength({ min: 8, max: 64 }).notEmpty().trim()];

exports.validateTrade = [body('category', 'Category cannot be empty').notEmpty().trim().escape(),
body('category', 'Category cannot be empty').notEmpty().trim().escape(),
body('tName', 'Title cannot be empty').notEmpty().trim(),
body('artist', 'Artist cannot be empty').notEmpty().trim().escape(),
body('edition', 'Edition cannot be empty').notEmpty().trim().escape(),
body('dimension', 'Dimension cannot be empty').notEmpty().trim().escape(),
body('desc', 'Description cannot be empty').notEmpty().trim().escape(),
body('details', 'Details must be at least 10 characters').isLength({ min: 10 }).notEmpty().trim().escape(),
body('image', 'Image cannot be empty').notEmpty().trim()];

exports.validateResult = (req, res, next) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
        errors.array().forEach(error => {
            req.flash('error', error.msg);
        });
        return res.redirect('back');
    } else {
        return next();
    }
};