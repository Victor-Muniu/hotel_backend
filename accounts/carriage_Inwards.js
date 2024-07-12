const mongoose = require('mongoose')
const sokoCarrageInwardsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
})

const CarrageInward= mongoose.model('CarrageInward',sokoCarrageInwardsSchema)
module.exports = CarrageInward