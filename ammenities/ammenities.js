const mongoose = require('mongoose')

const ammenitiesSchema = new mongoose.Schema({
    name : {
        type:String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    age_group: {
        type: String,
        required: true
    }
})

const Ammenities =mongoose.model('Ammenities',ammenitiesSchema)
module.exports = Ammenities