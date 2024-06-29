const express = require('express');
const router = express.Router();
const Payroll = require('../accounts/payroll.js');
const Staff = require('../models/staff.js');
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        req.userId = decoded.user.emp_no;
        console.log('User ID:', req.userId); 
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
}



async function isAdmin(req, res, next) {
    try {
        const user = await Staff.findOne({ emp_no: req.userId });
        console.log('User:', user); 
        if (!user || (user.role !== 'admin' && user.role !== 'accountant')) {
            console.log('User is not admin'); // Add this line for debugging
            return res.status(403).json({ message: 'Unauthorized: Only admin users can perform this action' });
        }
        console.log('User is admin'); // Add this line for debugging
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// POST: Create a new payroll
router.post('/payrolls',  verifyToken, isAdmin, async (req, res) => {
    try {
        const { gross_income, nhif_deductions, nssf_deductions, paye, emp_no } = req.body;

        // Calculate net income
        const net_income = gross_income - nhif_deductions - nssf_deductions - paye;

        // Find staff by emp_no
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

// GET: Retrieve all payrolls
router.get('/payrolls', verifyToken, isAdmin, async (req, res) => {
    try {
        const payrolls = await Payroll.find();
        res.json(payrolls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET: Retrieve a single payroll by ID
router.get('/payrolls/:id', verifyToken, isAdmin, async (req, res) => {
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

// PATCH: Update a payroll by ID
router.patch('/payrolls/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { gross_income, nhif_deductions, nssf_deductions, paye, emp_no } = req.body;

        // Calculate net income
        const net_income = gross_income - nhif_deductions - nssf_deductions - paye;

        // Find staff by emp_no
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

// DELETE: Delete a payroll by ID
router.delete('/payrolls/:id', verifyToken, isAdmin, async (req, res) => {
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
