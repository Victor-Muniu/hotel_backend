const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
    ammenitiesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AmmenitiesOrder',
        required: false
    },
    clubOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ClubBill',
        required: false
    },
    restaurantOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RestaurantBill',
        required: false
    },
    reservationsBillsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReservationBills',
        required: false
    },
    amount: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const Sales = mongoose.model('Sales', salesSchema);
module.exports = Sales;
