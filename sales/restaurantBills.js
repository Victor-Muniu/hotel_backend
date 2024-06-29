const mongoose = require('mongoose');

const restaurantBillSchema = new mongoose.Schema({
    restaurantOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RestaurantOrder',
        required: true
    },
    staffName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    menuName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'Not cleared'
    }
});

const RestaurantBill = mongoose.model('RestaurantBill', restaurantBillSchema);
module.exports = RestaurantBill;



