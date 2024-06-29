const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    movementType: {
        type: String,
        required: true,
        enum: ['purchase', 'sale', 'spoilage', 'transfer']
    },
    date: {
        type: Date,
        required: true
    }
});

const StockMovement = mongoose.model('StockMovement', stockMovementSchema);
module.exports = StockMovement;
