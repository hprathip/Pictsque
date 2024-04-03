const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tradeIemsSchema = new Schema({
    tradeInItem: { type: Schema.Types.ObjectId, ref: 'Trade' },
    interestedItem: { type: Schema.Types.ObjectId, ref: 'Trade' },
    offerStatus: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' }
},
    { timestamps: false });

module.exports = mongoose.model('TradeItemWithOther', tradeIemsSchema);