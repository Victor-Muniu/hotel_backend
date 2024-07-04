const mongoose = require('mongoose');


const individualSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    national_id: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

const reservationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['individual', 'group'],
        required: true
    },
    individual: {
        type: individualSchema,
        required: function() {
            return this.type === 'individual';
        }
    },
    group: {
        type: [individualSchema],
        required: function() {
            return this.type === 'group';
        }
    },

    group_name: {
        type: String,
        required: true
    },
    checkIndate: {
        type: Date,
        required: true
    },
    checkOutdate: {
        type: Date,
        required: true
    },
    adults: {
        type: Number,
        default: 1
    },
    kids: {
        type: Number,
        default: 0
    },
    room_no: {
        type: [Number],
        required: true
    },
    package_type: {
        type: [String],
        required: true, 
    }
});

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;
