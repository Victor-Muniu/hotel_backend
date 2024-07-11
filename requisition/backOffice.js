const mongoose = require('mongoose')
const backOfficeSchema = new mongoose.Schema({
    itemID : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
})

const BackOffice = mongoose.model('BackOffice', backOfficeSchema)
module.exports=BackOffice