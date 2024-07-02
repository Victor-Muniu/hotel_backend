const mongoose = require('mongoose')
const roomServiceSchema = new mongoose.Schema({
   menuId: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Menu',
        required: true
   },
   delivery_fee: {
        type: Number,
        default: 500,
   },
   quantity: {
    type: [Number],
    required: true
   },
   total: {
    type: Number,
    required: true,
   }
})

const RoomService = mongoose.model('RoomService', roomServiceSchema)
module.exports = RoomService