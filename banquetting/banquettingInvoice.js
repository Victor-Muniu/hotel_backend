const mongoose = require('mongoose')

const banquettingInvoiceSchema = new mongoose.Schema({
    banquettingId: {
        type: String,
        required: true
    },
    packs: {
        type: Number,
        required: true
    },
    Totalamount: {
        type: Number,
        required: true
    }
})

const BanquettingInvoice = mongoose.model('BanquettingInvoice',banquettingInvoiceSchema)
module.exports= BanquettingInvoice