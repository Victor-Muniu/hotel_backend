const mongoose = require('mongoose')
const laundryService = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },

})


const LaundryService = mongoose.model('LaundryService', laundryService)
module.exports = LaundryService