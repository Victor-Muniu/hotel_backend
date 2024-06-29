const express = require('express');
const jwt = require('jsonwebtoken');
const Staff = require('../models/staff.js');
const router = express.Router();
const Banquetting = require('../banquetting/banquetting.js');

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
            console.log('User has no authority'); 
            return res.status(403).json({ message: 'Unauthorized: Only admin or accountant users can perform this action' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

router.post('/banquettings',  async (req, res) => {
    try {
        const newBanquetting = new Banquetting(req.body);
        await newBanquetting.save();
        res.status(201).json(newBanquetting);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/banquettings',  async (req, res) => {
    try {
        const banquettings = await Banquetting.find();
        res.json(banquettings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/banquettings/:id',  async (req, res) =>{
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

router.patch('/banquettings/:id',  async (req, res) => {
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

router.delete('/banquettings/:id',  async (req, res) => {
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
