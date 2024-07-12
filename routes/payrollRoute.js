const express = require('express');
const router = express.Router();
const Payroll = require('../accounts/payroll.js');
const Staff = require('../models/staff.js');
const jwt = require('jsonwebtoken');






router.post('/payrolls',  async (req, res) => {
    try {
        const { gross_income, nhif_deductions, nssf_deductions, paye, emp_no } = req.body;

        
        const net_income = gross_income - nhif_deductions - nssf_deductions - paye;

        
        const staff = await Staff.findOne({ emp_no });
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const newPayroll = new Payroll({
            gross_income,
            net_income,
            nhif_deductions,
            nssf_deductions,
            paye,
            staff_Id: staff._id
        });

        await newPayroll.save();
        res.status(201).json(newPayroll);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/payrolls',  async (req, res) => {
    try {
        const payrolls = await Payroll.find();
        res.json(payrolls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/payrolls/:id',  async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id);
        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }
        res.json(payroll);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/payrolls/:id',  async (req, res) => {
    try {
        const { gross_income, nhif_deductions, nssf_deductions, paye, emp_no } = req.body;

        
        const net_income = gross_income - nhif_deductions - nssf_deductions - paye;

        
        const staff = await Staff.findOne({ emp_no });
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const updatedPayroll = await Payroll.findByIdAndUpdate(req.params.id, {
            gross_income,
            net_income,
            nhif_deductions,
            nssf_deductions,
            paye,
            staff_Id: staff._id
        }, { new: true });

        if (!updatedPayroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        res.json(updatedPayroll);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



router.delete('/payrolls/:id',  async (req, res) => {
    try {
        const payroll = await Payroll.findByIdAndRemove(req.params.id);
        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }
        res.json({ message: 'Payroll deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
