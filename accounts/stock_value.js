const mongoose = require('mongoose');
const stock_valueSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
})

const StockValue = mongoose.model('StockValue',stock_valueSchema)
module.exports = StockValue