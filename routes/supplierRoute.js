const express = require('express');
const jwt = require('jsonwebtoken');
const Staff = require('../models/staff.js');
const router = express.Router();
const Supplier = require('../supplier/supplier.js');



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


// Middleware to check if user is admin
async function isAdmin(req, res, next) {
    try {
        const user = await Staff.findOne({ emp_no: req.userId });
        console.log('User:', user); 
        if (!user || (user.role !== 'admin' && user.role !== 'storekeeper' && user.role !== 'accountant')) {
            console.log('User has no authority'); 
            return res.status(403).json({ message: 'Unauthorized: Only admin or storekeeper users can perform this action' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}


router.post('/suppliers', async (req, res) => {
    try {
        const newSupplier = new Supplier(req.body);
        await newSupplier.save();
        res.status(201).json(newSupplier);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/suppliers', async (req, res) => {
    try {
        const suppliers = await Supplier.find();
        res.json(suppliers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/suppliers/:id', async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json(supplier);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/suppliers/:id', async (req, res) => {
    try {
        const updatedSupplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedSupplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json(updatedSupplier);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/suppliers/:id',  async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndRemove(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }
        res.json({ message: 'Supplier deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
