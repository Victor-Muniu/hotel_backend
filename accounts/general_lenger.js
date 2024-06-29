const mongoose = require('mongoose')


const generalLegerScheme =new mongoose.Schema({
    category: {
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
    }, 
    
})

const GeneralLeger = mongoose.model('GeneralLeger',generalLegerScheme)
module.exports  = GeneralLeger