
const mongoose = require('mongoose');

const debtorsSchema = new mongoose.Schema({
    banquettingInvoiceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BanquettingInvoice',
        required: true
    }
});

const Debtors = mongoose.model('Debtors', debtorsSchema);
module.exports = Debtors;