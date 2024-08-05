const mongoose = require('mongoose')
const chefsLadderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    opening_stock: {
        type: Number,
        required: true
    },
    closing_stock: {
        type: Number,
        required: true
    },
    total: {
        type:Number,
        required: true
    },
    issued: {
        type: Number,
        required: true
    },
    RT: {
        type: String,
        required: true
    },
    sold: {
        type: Number,
        required: true
    },
    remarks: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    shift: {
        type: String,
        required: true
    }
})
const CheffsLadder = mongoose.model('CheffsLadder', chefsLadderSchema)
module.exports = CheffsLadder