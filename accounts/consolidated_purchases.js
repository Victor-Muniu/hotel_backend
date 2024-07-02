const mongoose = require('mongoose');

const consolidated_purchasesSchema = new mongoose.Schema({
    category: {
        type: String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true
    }, 
    price: {
        type: Number,
        required: true
    },
    vendor: {
        type: String,
        required: true,
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

const Consolidated_purchases = mongoose.model('Consolidated_purchases', consolidated_purchasesSchema)
module.exports=Consolidated_purchases