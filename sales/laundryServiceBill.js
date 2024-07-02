const mongoose = require('mongoose');

const laundryServiceBillSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    laundryServices: [{
        laundryID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LaundryService',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    total: {
        type: Number,
        required: true
    }
});

const LaundryServiceBill = mongoose.model('LaundryServiceBill', laundryServiceBillSchema);
module.exports = LaundryServiceBill;
