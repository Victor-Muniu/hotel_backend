const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    Kra_pin:{
        type: String,
        required: true,
        unique: true
    },
    Vat_no: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true,
        unique: true
    },
    zip_code: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    contact_person: {
        type: String,
        required: true
    },
    credit_limit: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    telephone_no: {
        type: String,
        required: true,
        unique: true
    }
})

const Supplier = mongoose.model('Supplier', supplierSchema)
module.exports =Supplier