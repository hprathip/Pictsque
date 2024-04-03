const model = require('../models/trade');
const watchList = require('../models/watchTradeItem');
const tradeIn = require('../models/tradeIn');

exports.trades = (req, res, next) => {
    let categories = [];
    model.distinct("category")
        .then(function (results) {
            categories = results;
            model.find().sort({ category: -1, name: 1 })
                .then((trades) => {
                    res.render('./trade/trades', { trades, categories });
                })
                .catch(err => next(err));
        })
        .catch(function (error) {
            console.log("Error: " + error);
        });

};

exports.show = (req, res, next) => {
    let addedByUsr = req.session.user;
    let id = req.params.id;
    let flag = 0;
    model.findById(id).populate('addedBy', 'firstName lastName')
        .then(trade => {
            if (trade) {
                watchList.findOne({ trade: id, addedBy: addedByUsr })
                    .then(item => {
                        if (item) {
                            flag = 1;
                            return res.render('./trade/trade', { trade, item, flag });
                        } else {
                            flag = 0;
                            return res.render('./trade/trade', { trade, flag });
                        }
                    })
                    .catch(err => next(err));

            } else {
                let err = new Error('Cannot find a trade with id ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));

};

exports.edit = (req, res, next) => {
    let id = req.params.id;

    model.findById(id)
        .then(trade => {
            if (trade) {
                return res.render('./trade/editTrade', { trade });
            } else {
                let err = new Error('Cannot find a trade with id ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));
};

exports.update = (req, res, next) => {
    let trade = req.body;
    let id = req.params.id;

    model.findByIdAndUpdate(id, trade, { useFindAndModify: false, runValidators: true })
        .then(trade => {
            if (trade) {
                req.flash('success', 'Trade has been successfully updated');
                res.redirect('/trades/' + id);
            } else {
                let err = new Error('Cannot find a trade with id ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => {
            if (err.name === 'ValidationError') {
                req.flash('error', err.message);
                res.redirect('back');
                // err.status = 400;
            } else {
                next(err);
            }
        });
};


exports.delete = (req, res, next) => {
    let id = req.params.id;
    // let id = "644d866dfe9ba94f143026fa";
    model.findById(id)
        .then(tr => {
            if (tr) {
                if (tr.status == "Available") {
                    model.findByIdAndDelete(id, { useFindAndModify: false })
                        .then(tr => {
                            if (tr) {
                                res.redirect('/trades');
                            } else {
                                next(err);
                            }
                        })
                        .catch(err => next(err));
                } else {
                    console.log(id);
                    tradeIn.findOne({ tradeInItem: id })
                        .then(tr1 => {
                            console.log(tr1);
                            if (tr1) {
                                let trId = tr1._id;
                                console.log(trId);
                                model.updateOne({ _id: tr1.interestedItem }, { $set: { status: "Available" } })
                                    .then(tr2 => {
                                        if (tr2) {
                                            tradeIn.findByIdAndDelete(trId, { useFindAndModify: false })
                                                .then(delT => {
                                                    if (delT) {
                                                        model.findByIdAndDelete(id, { useFindAndModify: false })
                                                            .then(res.redirect('/trades'))
                                                            .catch(err => next(err));
                                                    }
                                                })
                                                .catch(err => next(err));
                                        }
                                    })
                                    .catch(err => next(err));
                            } else {
                                tradeIn.findOne({ interestedItem: id })
                                    .then(tr1 => {
                                        if (tr1) {
                                            let trId = tr1._id;
                                            console.log(trId);
                                            model.updateOne({ _id: tr1.tradeInItem }, { $set: { status: "Available" } })
                                                .then(tr2 => {
                                                    if (tr2) {
                                                        tradeIn.findByIdAndDelete(trId, { useFindAndModify: false })
                                                            .then(delT => {
                                                                if (delT) {
                                                                    model.findByIdAndDelete(id, { useFindAndModify: false })
                                                                        .then(res.redirect('/trades'))
                                                                        .catch(err => next(err));
                                                                }
                                                            })
                                                            .catch(err => next(err));
                                                    }
                                                })
                                                .catch(err => next(err));
                                        }
                                    })
                                    .catch(err => next(err));
                            }
                        })
                        .catch(err => next(err));
                }
            } else {
                req.flash('error', 'Cannot delete the trade');
                // res.redirect('back');
            }
        })
        .catch(err => next(err));

    // model.findByIdAndDelete(id, { useFindAndModify: false })
    //     .then(trade => {
    //         if (trade) {
    //             res.redirect('/trades');
    //         } else {
    //             let err = new Error('Cannot find a trade with id ' + id);
    //             err.status = 404;
    //             return next(err);
    //         }
    //     })
    //     .catch(err => next(err));
};

exports.new = (req, res) => {
    res.render('./trade/newTrade');
};

exports.create = (req, res, next) => {
    let newTrade = new model(req.body);//create a new trade document
    newTrade.addedBy = req.session.user;
    newTrade.status = "Available";
    // newTrade.tradeWith= '';
    // newTrade.isWatch = "Unwatch";
    newTrade.save()//insert the document to the database
        .then(trade => {
            req.flash('success', 'You have successfully created a new trade');
            res.redirect('/trades');
        })
        .catch(err => {
            if (err.name === 'ValidationError') {
                req.flash('error', err.message);
                res.redirect('back');
                // err.status = 400;
            } else {
                next(err);
            }
        });
};

exports.createWatchItem = (req, res, next) => {
    let addedByUsr = req.session.user;
    let id = req.params.id;
    let isWatchS = req.body.isWatchStatus;

    model.findById(id)
        .then(trade => {
            if (trade) {
                if (trade.addedBy == addedByUsr) {
                    let err = new Error('Unauthorized to access the resource');
                    err.status = 401;
                    return next(err);
                } else {
                    watchList.updateOne({ trade: id, addedBy: addedByUsr },
                        { $set: { trade: id, addedBy: addedByUsr, isWatch: isWatchS } },
                        { upsert: true })
                        .then(watchI => {
                            if (watchI)
                                res.redirect('back');
                            else {
                                req.flash('error', 'There is some problem in adding the item to watch list');
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
                }
            } else {
                let err = new Error('Cannot find a trade with id ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));
};

exports.deleteWatchItem = (req, res, next) => {
    let id = req.params.id;
    let addedByUsr = req.session.user;
    console.log(addedByUsr);
    watchList.findOneAndDelete({ trade: id, addedBy: addedByUsr })
        .then(trade => {
            if (trade) {
                res.redirect('back');
            } else {
                let err = new Error('Cannot find a watchItem with id ' + id);
                err.status = 404;
                return next(err);
            }
        })
        .catch(err => next(err));
};

exports.updateTradeStatus = (req, res, next) => {
    let item1 = req.body;

    let itemOtherId = req.params.id;
    Promise.all([model.findById(item1.trade), model.findById(itemOtherId)])
        .then((result) => {
            const [myItem, other] = result;
            // console.log(res);
            myItem.status = 'Offer Pending';
            myItem.save();

            other.status = 'Offer Pending';
            other.tradeWith = myItem._id;
            other.save();

            res.redirect('/users/profile');

        })
        .catch((err) => {
            console.log(err);
            next(err);
        })
};