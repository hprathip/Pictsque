const model = require('../models/user');
const Trade = require('../models/trade');
const watchList = require('../models/watchTradeItem');
const tradeIn = require('../models/tradeIn');

exports.new = (req, res) => {
    res.render('./user/new');
};

exports.create = (req, res, next) => {
    let user = new model(req.body);//create a new user document
    if (user.email)
        user.email = user.email.toLowerCase();
    user.save()//insert the document to the database
        .then(user => {
            req.flash('success', 'Account created successfully');
            res.redirect('/users/login')
        })
        .catch(err => {
            if (err.name === 'ValidationError') {
                req.flash('error', err.message);
                return res.redirect('/users/new');
            }

            if (err.code === 11000) {
                req.flash('error', 'Email has been used');
                return res.redirect('/users/new');
            }

            next(err);
        });

};

exports.ownItems = (req, res, next) => {
    let id = req.session.user;
    let interest = req.params.id;
    Promise.all([model.findById(id), Trade.find({ addedBy: id, status: "Available" })])
        .then(results => {
            const [user, trades] = results;
            res.render('./trade/tradeItem', { user, trades, interest });
        })
        .catch(err => next(err));
};

exports.getUserLogin = (req, res, next) => {

    res.render('./user/login');

}

exports.login = (req, res, next) => {
    let email = req.body.email;
    if (email)
        email = email.toLowerCase();
    let password = req.body.password;
    model.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'wrong email address');
                res.redirect('/users/login');
            } else {
                user.comparePassword(password)
                    .then(result => {
                        if (result) {
                            req.session.user = user._id;
                            req.session.firstName = user.firstName;
                            req.session.lastName = user.lastName;
                            req.flash('success', 'You have successfully logged in');
                            res.redirect('/users/profile');
                        } else {
                            req.flash('error', 'wrong password');
                            res.redirect('/users/login');
                        }
                    })
                    .catch(err => next(err));
            }
        })
        .catch(err => next(err));
};

// exports.profile = (req, res, next) => {
//     let id = req.session.user;
//     Promise.all([model.findById(id), Trade.find({ addedBy: id }), watchList.find({ addedBy: id, isWatch: "Watch" }).populate('trade'), tradeIn.find({ addedBy: id }).populate('interestedItem'), tradeIn.find().populate('interestedItem').populate('tradeInItem')])
//         .then(results => {
//             const [user, trades, items, offers, tradeDeals] = results;
//             res.render('./user/profile', { user, trades, items, offers, tradeDeals });
//         })
//         .catch(err => next(err));
// };

exports.profile = (req, res, next) => {
    let id = req.session.user;

    let pendingTradeIds = [];
    Trade.find({ addedBy: id, status: 'Offer Pending' })
        .then((pendingTrades) => {
            return (pendingTradeIds = pendingTrades.map((pt) => pt._id.toString()));
        })
        .then(async (response) => {
            const results = await Promise.all([
                model.findById(id),
                Trade.find({ addedBy: id }),
                (await watchList.find({ addedBy: id }).populate('trade')),
                Trade.find({ tradeWith: { $in: response } })
            ]);
            const [user, trades, items, offers] = results;
            res.render('./user/profile', { user, trades, items, offers });
        })
        .catch((err) => next(err));
};

exports.makeOffer = (req, res, next) => {
    let addedByUsr = req.session.user;
    let interest_id = req.params.id;
    let tradeIn_id = req.body.tradeInId;

    tradeIn.updateOne({ tradeInItem: tradeIn_id, interestedItem: interest_id, addedBy: addedByUsr },
        { $set: { tradeInItem: tradeIn_id, interestedItem: interest_id, addedBy: addedByUsr, offerStatus: "Offer Pending" } },
        { upsert: true })
        .then(ti => {
            if (ti) {
                tradeIn.findById(ti.upsertedId)
                    .then(imp => {
                        if (imp) {
                            Trade.updateOne({ _id: imp.interestedItem },
                                { $set: { status: "Offer Pending" } })
                                .then(tr1 => {
                                    if (tr1) {
                                        Trade.updateOne({ _id: imp.tradeInItem },
                                            { $set: { status: "Offer Pending" } })
                                            .then(tr2 => {
                                                if (tr2) {
                                                    res.redirect('/users/profile');
                                                } else {
                                                    req.flash('error', 'Cannot make the offer');
                                                    res.redirect('back');
                                                }
                                            })
                                            .catch(err => next(err));
                                    } else {
                                        req.flash('error', 'Cannot make the offer');
                                        res.redirect('back');
                                    }
                                })
                                .catch(err => next(err));
                        } else {
                            req.flash('error', 'Cannot make the offer');
                            res.redirect('back');
                        }
                    })
                    .catch(err => next(err));

            } else {
                req.flash('error', 'There is some problem in trading with this item');
                res.redirect('back');
            }
        })
        .catch(err => {
            if (err.name === 'ValidationError') {
                req.flash('error', err.message);
                res.redirect('back');
            }
            else {
                next(err);
            }
        });
};

exports.viewOffer = (req, res, next) => {
    let id = req.params.id;

    tradeIn.findById(id).populate('tradeInItem').populate('interestedItem')
        .then(offer => {
            if (offer) {
                res.render('./trade/manageOffer', { offer });
            } else {
                req.flash('error', 'There is some problem fetching the offer');
                res.redirect('back');
            }
        })
        .catch(err => next(err));
};

exports.cancelOffer = (req, res, next) => {
    let id = req.params.id;

    tradeIn.findByIdAndDelete(id, { useFindAndModify: false })
        .then(ti => {
            if (ti) {
                Trade.updateOne({ _id: ti.interestedItem }, { $set: { status: "Available" } })
                    .then(it1 => {
                        Trade.updateOne({ _id: ti.tradeInItem }, { $set: { status: "Available" } })
                            .then(it2 => {
                                if (it2) {
                                    req.flash('success', 'You have successfully cancelled the offer');
                                    res.redirect('/users/profile');
                                } else {
                                    req.flash('error', 'Cannot cancel the offer');
                                    res.redirect('back');
                                }
                            })
                            .catch(err => next(err));
                    })
                    .catch(err => next(err));
            } else {
                req.flash('error', 'There is some problem in cancelling the offer');
                res.redirect('back');
            }
        })
        .catch(err => next(err));
};

exports.acceptOffer = (req, res, next) => {
    let id = req.params.id;

    tradeIn.findByIdAndUpdate(id, { $set: { status: 'Traded' } }, { useFindAndModify: false })
        .then(ti => {
            if (ti) {
                Trade.findByIdAndDelete(ti.tradeInItem, { useFindAndModify: false })
                    .then(del1 => {
                        watchList.findByIdAndDelete(del1, { useFindAndModify: false })
                            .then(del2 => {
                                Trade.findByIdAndUpdate(ti.interestedItem, { $set: { status: 'Traded' } }, { useFindAndModify: false })
                                    .then(del3 => {
                                        watchList.findByIdAndDelete(del3, { useFindAndModify: false })
                                            .then(() => {
                                                req.flash('success', 'Items are traded successfully');
                                                res.redirect('/users/profile');
                                            })
                                            .catch(err => next(err));
                                    })
                                    .catch(err => next(err));
                            })
                            .catch(err => next(err));
                    })
                    .catch(err => next(err));
            } else {
                req.flash('error', 'There is some problem in cancelling the offer');
                res.redirect('back');
            }
        })
        .catch(err => next(err));
};

exports.offer = (req, res, next) => {
    let tId = req.params.id;
    
    Trade.findOne({ tradeWith: tId })
        .then((otherT) => {
            console.log(otherT);
            Trade.findById(otherT.tradeWith)
                .then((Town) => {
                    res.render('./user/offer', { Town, otherT });
                })
                .catch((err) => next(err));
        })
        .catch((err) => next(err));
};

exports.ownOffer = (req, res, next) => {
    let tId = req.params.id;
    Trade.findById(tId)
        .then(async (Town) => {
            Trade.findById(Town.tradeWith)
                .then((otherT) => {
                    res.render('./user/offer', { otherT, Town });
                })
                .catch((err) => next(err));
        })
        .catch((err) => next(err));
};

exports.cancelOffer1 = (req, res, next) => {
    let tradeIds = req.params.id.split('&');
    let othersTradeId = tradeIds[0];
    let ownTradeId = tradeIds[1];

    Trade.findByIdAndUpdate(othersTradeId, { $unset: { tradeWith: '' }, $set: { status: 'Available' } }, { useFindAndModify: false, runValidators: true })
        .then((result) => {
            if (result) {
                Trade.findByIdAndUpdate(ownTradeId, { $unset: { tradeWith: '' }, $set: { status: 'Available' } }, { useFindAndModify: false, runValidators: true })
                    .then((x) => {
                        req.flash('success', 'Offer is cancelled');
                        res.redirect('/users/profile');
                    });
            } else {
                req.flash('error', 'Offer cannot be canceled');
                res.redirect('/users/profile');
            }
        })
        .catch((err) => next(err));
};

exports.acceptOffer1 = (req, res, next) => {
    let tradeIds = req.params.id.split('&');
    let othersTradeId = tradeIds[0];
    let ownTradeId = tradeIds[1];

    Trade.findByIdAndUpdate(othersTradeId, { $unset: { tradeWith: '' }, $set: { status: 'Traded' } }, { useFindAndModify: false, runValidators: true })
        .then((result) => {
            if (result) {
                Trade.findByIdAndUpdate(ownTradeId, { $unset: { tradeWith: '' }, $set: { status: 'Traded' } }, { useFindAndModify: false, runValidators: true })
                    .then((x) => {
                        req.flash('success', 'Offer accepted');
                        res.redirect('/users/profile');
                    });
            } else {
                req.flash('error', 'Offer cannot be accepted');
                res.redirect('back');
            }
        })
        .catch((err) => next(err));
};

exports.logout = (req, res, next) => {
    req.session.destroy(err => {
        if (err)
            return next(err);
        else
            res.redirect('/');
    });

};