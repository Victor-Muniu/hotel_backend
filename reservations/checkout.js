const mongoose = require('mongoose')
const checkOutSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    national_id: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
})

const CheckOut = mongoose.model('Checkout',checkOutSchema)
module.exports = CheckOut