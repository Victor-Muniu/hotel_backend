const mongoose = require('mongoose');

const creditorsSchema = new mongoose.Schema({
    requisitionID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    }
});

const Creditors = mongoose.model('Creditors', creditorsSchema);
module.exports = Creditors;
