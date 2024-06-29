const express = require('express');
const Staff = require('../models/staff.js');

const router = express.Router();

// GET all staff
router.get('/staff', async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET one staff by id
router.get('/staff/:id', getStaff, (req, res) => {
    res.json(res.staff);
});

// POST create a new staff
router.post('/staff', async (req, res) => {
    const staff = new Staff({
        fname: req.body.fname,
        lname: req.body.lname,
        role: req.body.role,
        email: req.body.email,
        password: req.body.password,
        emp_no: req.body.emp_no
    });

    try {
        const newStaff = await staff.save();
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH update one staff by id
router.patch('/staff/:id', getStaff, async (req, res) => {
    if (req.body.fname != null) {
        res.staff.fname = req.body.fname;
    }
    if (req.body.lname != null){
        res.staff.lname = req.body.lname
    }
    if (req.body.role != null) {
        res.staff.role = req.body.role;
    }
    if (req.body.email != null) {
        res.staff.email = req.body.email;
    }
    if(req.body.password !=null){
        res.staff.email =req.body.password
    }

    try {
        const updatedStaff = await res.staff.save();
        res.json(updatedStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE one staff by id
router.delete('/staff/:id', getStaff, async (req, res) => {
    try {
        await res.staff.deleteOne();
        res.json({ message: 'Staff member deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function getStaff(req, res, next) {
    let staff;
    try {
        staff = await Staff.findById(req.params.id);
        if (staff == null) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.staff = staff;
    next();
}

module.exports = router;