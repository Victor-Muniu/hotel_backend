const express = require('express');
const router = express.Router();
const LaundryService = require('../reservations/laundry_service');

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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'front office' )) {
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

router.post('/laundry-services', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, price } = req.body;

        const newLaundryService = new LaundryService({
            name,
            price
        });

        await newLaundryService.save();
        res.status(201).json(newLaundryService);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/laundry-services', verifyToken, isAdmin, async (req, res) => {
    try {
        const laundryServices = await LaundryService.find();
        res.json(laundryServices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/laundry-services/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const laundryService = await LaundryService.findById(req.params.id);
        if (!laundryService) {
            return res.status(404).json({ message: 'Laundry service not found' });
        }
        res.json(laundryService);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/laundry-services/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const updatedData = req.body;

        const updatedLaundryService = await LaundryService.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!updatedLaundryService) {
            return res.status(404).json({ message: 'Laundry service not found' });
        }
        res.json(updatedLaundryService);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.delete('/laundry-services/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const deletedLaundryService = await LaundryService.findByIdAndDelete(req.params.id);
        if (!deletedLaundryService) {
            return res.status(404).json({ message: 'Laundry service not found' });
        }
        res.json({ message: 'Laundry service deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
