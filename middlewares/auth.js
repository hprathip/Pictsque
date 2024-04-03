const Story = require('../models/trade');

// check if the user is a guest
exports.isGuest = (req, res, next) => {
    if (!req.session.user)
        return next();
    else {
        req.flash('error', 'You are logged in already');
        return res.redirect('/users/profile');
    }
};

// check if user is authenticated
exports.isLoggedIn = (req, res, next) => {
    if (req.session.user)
        return next();
    else {
        req.flash('error', 'You need to log in first');
        return res.redirect('/users/login');
    }
};

// check if the user is the owner of the trade item
exports.isOwner = (req, res, next) => {
    let id = req.params.id;
    Story.findById(id)
    .then(trade=>{
        if(trade.addedBy == req.session.user){
            return next();
        } else {
            let err= new Error('Unauthorized to access the resource');
            err.status = 401;
            return next(err);
        }
    })
    .catch(err=>next(err));
};