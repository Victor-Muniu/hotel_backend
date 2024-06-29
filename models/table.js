const mongoose = require('mongoose')


const tableSchema = new mongoose.Schema({
    table_no: {
        type: Number,
        required:true
    },
    status: {
        type: String,
        required: true
    },
    restaurant: {
        type: String,
        required: true
    }
})

const Table = mongoose.model('Table',tableSchema)
module.exports= Table