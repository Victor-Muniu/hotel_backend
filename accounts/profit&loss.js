const mongoose = require('mongoose')

const profit_LossSchema = new mongoose.Schema({
    group_name: {
        type: String,
        required: false
    },
    Debit: {
        type: Number,
        required: false
    },
    Credit: {
        type: Number,
        required: false
    },
    Date: {
        type: Date,
        required: false
    }
})
const ProfitLoss = mongoose.model('ProfitLoss', profit_LossSchema)
module.exports = ProfitLoss