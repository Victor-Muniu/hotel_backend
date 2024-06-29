const mongoose = require('mongoose');


const orderSchema =new mongoose.Schema({
    menu_id: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    staff_id: {
        type: String,
        required: true
    }
})

const Order = mongoose.model('Order',orderSchema)
module.exports = Order