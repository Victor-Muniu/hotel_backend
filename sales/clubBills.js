const mongoose = require('mongoose');

const clubBillsSchema = new mongoose.Schema({
    clubOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClubOrder',
        required: true
    },
    staffName: {
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
    },
    menuName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Not cleared'
    }
})

const ClubBill = mongoose.model('ClubBill',clubBillsSchema)
module.exports = ClubBill

