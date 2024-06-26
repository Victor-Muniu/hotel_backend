const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    gross_income: {
        type: Number,
        required: true
    },
    net_income: {
        type: Number,
        required: true
    }, 
    nhif_deductions: {
        type: Number,
        required: true
    },
    nssf_deductions: {
        type: Number,
        required: true
    },
    paye: {
        type: Number,
        required: true
    },
    staff_Id: {
        type: String,
        required: true,
        unique: true
    }
})

const Payroll = mongoose.model('Payroll', payrollSchema)
module.exports = Payroll