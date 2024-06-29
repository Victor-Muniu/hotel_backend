const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
    },
    lname:{
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        unique: true
    },
    emp_no: {
        type: String,
        required: true,
        unique: true
    }
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
