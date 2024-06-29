const mongoose = require('mongoose')
const hallAllocationSchema = new mongoose.Schema({
    banquttingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Banquetting',
        required: true
    },
    hall_name:{
        type: String, 
        required: true
    }
})
const HallAllocation = mongoose.model('HallAllocation', hallAllocationSchema)
module.exports = HallAllocation