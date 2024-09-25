const express = require('express');
const router = express.Router();
const Transfer = require('../transfer/drinks');
const Sales = require('../accounts/sales'); 

const Staff = require('../models/staff')
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }
    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        if (!decoded || !decoded.user || !decoded.user.emp_no) {
            console.log('Token does not contain user information');
            return res.status(403).json({ message: 'Unauthorized: Invalid token' });
        }
        req.userEmpNo = decoded.user.emp_no; 
        
        next();
    } catch (err) {
        res.clearCookie('token', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
        });
        console.log('Token verification error:', err.message);
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
}


async function isAdmin(req, res, next) {
    try {
        console.log('User emp_no from token:', req.userEmpNo); 
        
        const user = await Staff.findOne({ emp_no: req.userEmpNo }); 
        console.log('User fetched from database:', user); 
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'front office' && user.role !== 'service' && user.role !== 'procurement')) {
            console.log('User is not admin');
            return res.status(403).json({ message: 'Unauthorized: Only admin users can perform this action' });
        }
        
        console.log('User is Admin');
        next(); 
    } catch (err) {
        console.error('Error in isAdmin middleware:', err.message);
        res.status(500).json({ message: err.message });
    }
}

router.get('/transfers', verifyToken, isAdmin, async (req, res) => {
    try {
        const transfers = await Transfer.find();
        res.json(transfers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/transfers/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }
        res.json(transfer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/transfers', verifyToken, isAdmin, async (req, res) => {
    const { name, description, group, unit_price, quantity, spoilt, value, date } = req.body;

    const newTransfer = new Transfer({
        name,
        description,
        group,
        unit_price,
        quantity,
        spoilt,
        value,
        date
    });

    try {
        const savedTransfer = await newTransfer.save();
        res.status(201).json(savedTransfer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.patch('/transfers/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }
        Object.keys(req.body).forEach(key => {
            transfer[key] = req.body[key];
        });

        if (transfer.unit_price && transfer.quantity) {
            transfer.value = transfer.unit_price * transfer.quantity;
        }

        const updatedTransfer = await transfer.save();
        res.json(updatedTransfer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/transfers/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }

        await transfer.remove();
        res.json({ message: 'Transfer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
