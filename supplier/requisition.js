const mongoose = require('mongoose');

const requisitionSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true
    },
    supplierId: {
        type: String,
        required: true
    },
    date:{
        type: Date,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    unit_price: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
});

const Requisition = mongoose.model('Requisition', requisitionSchema);
module.exports = Requisition;
