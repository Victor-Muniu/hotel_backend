const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: false
    },
    group:{
        type: String,
        required: false
    },
    unit_price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    spoilt: {
        type: Number,
        default: 0
    },
    value:{
        type: Number,
        default: 0
    },
    date: {
        type: Date,
        required: true
    }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;

