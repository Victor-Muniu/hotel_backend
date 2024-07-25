const mongoose = require('mongoose');

const varianceReportSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    spoilt: {
        type: Number,
        required: true
    },
    report: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const VarianceReport = mongoose.model('VarianceReport', varianceReportSchema);
module.exports = VarianceReport;
