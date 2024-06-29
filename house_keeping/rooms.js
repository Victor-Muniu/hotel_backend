const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    block: {
        type: String,
        required: true
    },
    clean: {
        type: String,
        required: true
    },
    room_no: {
        type: Number,
        required: true,
        unique: true
    },
    damage_report: {
        type: String,
        required: true
    },
    vacancy: {
        type: String,
        required: true
    }
})


const Room = mongoose.model('Room', roomSchema)
module.exports = Room