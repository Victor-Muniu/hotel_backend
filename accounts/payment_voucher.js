const mongoose = require('mongoose');
const paymentVoucherSchema = new mongoose.Schema({
    creditorsId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Creditors',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    authorizedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff', 
        required: true
    },
    authorizationDate: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Authorized', 'Rejected'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('PaymentVoucher', paymentVoucherSchema);
