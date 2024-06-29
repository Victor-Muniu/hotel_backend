const mongoose = require('mongoose')

const banquettingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    booking_no: {
        type: Number, 
        unique: true,
        required: true,

    },
    workshopName: {
        type: String,
        required: true
    },
    reservedDates : {
        type: Array,
        required: true
    },
    checkout: {
        type: Date,
        required: true
    },
    packs: {
        type: Number,
        required: true
    },
    package_type: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    }
    
})


const Banquetting = mongoose.model('Banquetting',banquettingSchema)
module.exports = Banquetting