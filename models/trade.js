const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tradeSchema = new Schema({
    category: {type: String, required: [true, 'Category is required']},
    tName: {type: String, required: [true, 'Name is required']},
    artist: {type: String, required: [true, 'Artist is required']},
    edition: {type: String, required: [true, 'Edition is required']},
    dimension: {type: String, required: [true, 'Dimension is required']},
    desc: {type: String, required: [true, 'Description is required']},
    details: {type: String, required: [true, 'Details are required'], minLength: [10, 'the details should have at least 10 characters']},
    image: {type: String, required: [true, 'Image is required']}, 
    status: {type: String},
    addedBy: {type: Schema.Types.ObjectId, ref: 'User'},
    tradeWith: {type: Schema.Types.ObjectId, ref: 'Trade'}
}, 
{timestamps: false});

module.exports = mongoose.model('Trade', tradeSchema);