const mongoose = require('mongoose')
const websiteSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone_number: {
        type:String,
        required: true
    },
    adults: {
        type: Number,
        default: 1,
    },
    kids: {
        type: Number,
        default: 0
    },
    no_of_rooms: {
        type: Number,
        default: 1
    },
    checkin: {
        type: Date,
        required: true
    },
    checkout: {
        type: Date,
        required: true
    },
    basis: {
        type: [String],
        required: true,
    },
    room_type: {
        type: [String],
        required: true,
    }
});
const Website = mongoose.model('Website', websiteSchema);
module.exports = Website