const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    tableId: {
        type: String,
        required: true
    },
    date: {
        type:Date,
        required: true
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    amount: {
        type: Number,
        required: true
    }, 
    remarks: {
        type: String,
        required: true
    }
});

const RestaurantOrder = mongoose.model('RestaurantOrder', orderSchema);
module.exports = RestaurantOrder;
