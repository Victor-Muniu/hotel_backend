const mongoose = require('mongoose');

const creditorsSchema = new mongoose.Schema({
    vendor:{
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
    status: {
        type: String,
        default: 'Not Paid'
    }
});

const Creditors = mongoose.model('Creditors', creditorsSchema);
module.exports = Creditors;
