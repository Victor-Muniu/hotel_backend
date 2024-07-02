const mongoose = require('mongoose')
const balanceSheetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true
    },
    date :{
        type: Date,
        required: true
    }
})

const BalanceSheet = mongoose.model('BalanceSheet', balanceSheetSchema)
module.exports = BalanceSheet