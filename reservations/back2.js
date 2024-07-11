const mongoose = require('mongoose')
const back2Schema = new mongoose.Schema({
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
})

const Back2 = mongoose.model('Back2', back2Schema)
module.exports = Back2