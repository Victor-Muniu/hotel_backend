const mongoose = require('mongoose')

const menuSchema = new mongoose.Schema({
    name: {
        type : String,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true
    },
    point_of_sale: {
        type: String,
        required: true
    }
})

const Menu = mongoose.model('Menu',menuSchema)
module.exports=Menu