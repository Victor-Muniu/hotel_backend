const mongoose = require('mongoose')
const curio_posSchema = new mongoose.Schema({
    curioId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Drinks',
        required: false
    },
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    quantity: {
        type: [Number],
        required: true
    },
    price: {
        type: [Number],
        required: true,
    },
    date: {
        type: Date,
        required: true
    },
    total_amount: {
        type: Number,
        required: true,
    }
})
const CurioPOS = mongoose.model('CurioPOS', curio_posSchema);
module.exports = CurioPOS