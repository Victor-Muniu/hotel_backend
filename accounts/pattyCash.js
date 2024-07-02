const mongoose = require('mongoose')
const pettyCashSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number, 
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
    }
})

const PettyCash = mongoose.model('PettyCash', pettyCashSchema)
module.exports = PettyCash