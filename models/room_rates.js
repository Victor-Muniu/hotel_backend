const mongoose = require('mongoose')
const room_rateSchema = new mongoose.Model({
    room_type: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'Ksh', 
        trim: true
    },
})
const Room_rate = mongoose.model('Room_rate',room_rateSchema)
module.exports = Room_rate