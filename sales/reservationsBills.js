const mongoose = require('mongoose')
const reservationBills = new mongoose.Schema({
    reservationID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reservation',
        required: true
    },
    total: {
        type: Number,
        required: true
    }
})

const ReservationBills = mongoose.model('ReservationBills', reservationBills)
module.exports = ReservationBills

