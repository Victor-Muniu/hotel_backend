const mongoose = require('mongoose');

const trial_balanceSchema = new mongoose.Schema({
    group_name: {
        type: String,
        required: false
    },
    Debit: {
        type: Number,
        required: false
    },
    Credit: {
        type: Number,
        required: false
    },
    Date: {
        type: Date,
        required: false
    }
});

const TrialBalance = mongoose.model('TrialBalance', trial_balanceSchema);
module.exports = TrialBalance;
