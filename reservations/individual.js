const mongoose = require('mongoose')

const individualSchema = new mongoose.Schema({
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
    city: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phoneNo: {
        type: String,
        required: true
    },
    nationality: {
        type: String,
        required: true
    },
    idNo: {
        type: String,
        required: true
    },
    checkin: {
        type: Date,
        required: true
    },
    checkout: {
        type: Date,
        required: true
    },
    find: {
        type: String,
        required: true
    },
    plan: {
        type: String,
        required: true
    },
    adults: {
        type: Number,
        default: 1,
        required: true
    },
    kids: {
        type: Number,
        default: 0,
        required: false
    },
    Total: {
        type: Number,
        required: true
    },
    room_no:{
        type: Number,
        required: true
    }
})

const Individual = mongoose.model('Individual',individualSchema)
module.exports = Individual