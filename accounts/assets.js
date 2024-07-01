const mongoose = require('mongoose')
const assetsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    group: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    issued: {
        type: Number,
        required: true
    },
    stored: {
        type: Number,
        required: true
    },
    spoilt: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    value: {
        type: Number,
        required: true
    }
})

const Assets = mongoose.model('Assets', assetsSchema)
module.exports=Assets