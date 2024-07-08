const mongoose = require('mongoose')
const dailyCollectionSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    float: {
        type: Number,
        required: true
    },
    cash_paid_out: {
        type: Number,
        required: true
    },
    mpesa: {
        type: Number,
        required: true,
    }, 
    cash: {
        type: Number,
        required: true,
    }, 
    pesa_pal: {
        type: Number,
        required: true,
    },
    equity: {
        type: Number,
        required: true,
    },
    cheque: {
        type: Number,
        required: true,
    }, 
    total_sales :{
        type: Number,
        required: true,
    },  
    total_revenue:{
        type: Number,
        required: true, 
    },
    shift: {
        type: String,
        required: true
    }
})
const DailyCollections = mongoose.model('DailyCollections', dailyCollectionSchema)
module.exports = DailyCollections