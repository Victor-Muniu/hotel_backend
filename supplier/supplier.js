const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    Kra_pin:{
        type: String,
        required: false,   
    },
    Vat_no: {
        type: String,
        required: false,   
    },
    address: {
        type: String,
        required: false,
    },
    zip_code: {
        type: String,
        required: false,
    },
    name: {
        type: String,
        required: false,
    },
    contact_person: {
        type: String,
        required: false,
    },
    credit_limit: {
        type: Number,
        required: false,
    },
    email: {
        type: String,
        required: false,
    },
    telephone_no: {
        type: String,
        required: false,
    }
})

const Supplier = mongoose.model('Supplier', supplierSchema)
module.exports =Supplier