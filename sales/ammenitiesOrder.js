const mongoose = require('mongoose')

const ammenitiesOrderSchema = new mongoose.Schema({
    ammenitiesId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Ammenities',
        required: true
    },
    age_group: {
        type: [String],
        required: true
    },
    quantity: {
        type: [Number],
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
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    }
});

const AmmenitiesOrder = mongoose.model('AmmenitiesOrder',ammenitiesOrderSchema)
module.exports=AmmenitiesOrder
