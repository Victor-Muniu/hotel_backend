const express = require('express');
const jwt = require('jsonwebtoken');
const Staff = require('../models/staff.js');
const router = express.Router();
const Banquetting = require('../banquetting/banquetting.js');

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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'front office' && user.role !== 'service' && user.role !== 'house keeping' && user.role !== 'procurement' && user.role == 'accounts')) {
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

router.post('/banquettings', verifyToken, isAdmin,  async (req, res) => {
    try {
        const newBanquetting = new Banquetting(req.body);
        await newBanquetting.save();
        res.status(201).json(newBanquetting);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/banquettings', verifyToken, isAdmin,  async (req, res) => {
    try {
        const banquettings = await Banquetting.find();
        res.json(banquettings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/banquettings/:id', verifyToken, isAdmin,  async (req, res) =>{
    try {
        const banquetting = await Banquetting.findById(req.params.id);
        if (!banquetting) {
            return res.status(404).json({ message: 'Banquetting not found' });
        }
        res.json(banquetting);
    } catch (err){
        res.status(500).json({ message: err.message });
    }
});

router.patch('/banquettings/:id', verifyToken, isAdmin,  async (req, res) => {
    try {
        const updatedBanquetting = await Banquetting.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBanquetting) {
            return res.status(404).json({ message: 'Banquetting not found' });
        }
        res.json(updatedBanquetting);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/banquettings/:id', verifyToken, isAdmin,  async (req, res) => {
    try {
        const banquetting = await Banquetting.findByIdAndRemove(req.params.id);
        if (!banquetting) {
            return res.status(404).json({ message: 'Banquetting not found' });
        }
        res.json({ message: 'Banquetting deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
