const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    category :{
        type: String,
        required: true,
    },
    sub_category:{
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    }
})

const Expense = mongoose.model('Expense', expenseSchema)
module.exports =Expense