const mongoose = require('mongoose')
const receipSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    raw_materials: {
        type: [String],
        required: true
    },
    quantity: {
        type: [Number],
        required: true
    },
    unit_price: {
        type: [Number],
        required: true
    },
    total: {
        type: [Number],
        required: true
    }
})
const Receipe = mongoose.model('Receipe', receipSchema);
module.exports = Receipe