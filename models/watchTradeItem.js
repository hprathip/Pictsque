const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const watchTradeItemSchema = new Schema({
    trade: { type: Schema.Types.ObjectId, ref: 'Trade' },
    isWatch: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' }
},
    { timestamps: false });

module.exports = mongoose.model('WatchTradeItem', watchTradeItemSchema);