const express = require('express');
const router = express.Router();
const Ammenities = require('../ammenities/ammenities');
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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'front office')) {
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

router.post('/ammenities', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, price, age_group } = req.body;

        const newAmmenity = new Ammenities({
            name,
            price,
            age_group
        });

        await newAmmenity.save();
        res.status(201).json(newAmmenity);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/ammenities', verifyToken, isAdmin, async (req, res) => {
    try {
        const ammenities = await Ammenities.find();
        res.json(ammenities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/ammenities/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const ammenity = await Ammenities.findById(req.params.id);
        if (!ammenity) {
            return res.status(404).json({ message: 'Ammenity not found' });
        }
        res.json(ammenity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/ammenities/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, price, age_group } = req.body;
        const ammenity = await Ammenities.findById(req.params.id);
        if (!ammenity) {
            return res.status(404).json({ message: 'Ammenity not found' });
        }

        if (name) ammenity.name = name;
        if (price) ammenity.price = price;
        if (age_group) ammenity.age_group = age_group;

        const updatedAmmenity = await ammenity.save();
        res.json(updatedAmmenity);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/ammenities/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const ammenity = await Ammenities.findById(req.params.id);
        if (!ammenity) {
            return res.status(404).json({ message: 'Ammenity not found' });
        }

        await ammenity.deleteOne();
        res.json({ message: 'Ammenity deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
