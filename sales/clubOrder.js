const mongoose = require('mongoose');



const itemSchema = new mongoose.Schema({
    menuId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
});
const clubOrderSchema = new mongoose.Schema({
    items: {
        type: [itemSchema],
        required: true
    },
    tableId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    remarks: {
        type: String,
        required: true
    }
});

const ClubOrder = mongoose.models.ClubOrder || mongoose.model('ClubOrder', clubOrderSchema);
module.exports = ClubOrder;
