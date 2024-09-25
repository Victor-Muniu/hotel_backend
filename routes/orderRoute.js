const express = require('express');
const router = express.Router();
const Table = require('../models/table');
const Staff = require('../models/staff')
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next){
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({message: 'Unauthorized: Missing token'});
    }
    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        req.userId = decoded.user.emp_no;
        console.log('User ID:' , req.userId);
        next();
    }catch (err){
        res.clearCookie('token', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
        });
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
        
    }
}

async function isAdmin(req, res, next){
    try{
        const user = await Staff.findOne({emp_no: req.userId});
        console.log('User', user);
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'service')){
            console.log('User is not admin');
            return res.status(403).json({message: "Unauthorized: Only admin users can perform this action"});
            
        }
        console.log('User is Admin')
    } catch (err){
        res.status(500).json({message: err.message});
    }
}
router.post('/tables', verifyToken, isAdmin,   async (req, res) => {
    try {
        const newTable = new Table(req.body);
        await newTable.save();
        res.status(201).json(newTable);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/tables', verifyToken, isAdmin,   async (req, res) => {
    try {
        const tables = await Table.find();
        res.json(tables);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/tables/:id', verifyToken, isAdmin,   async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.json(table);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/tables/:id', verifyToken, isAdmin,   async (req, res) => {
    try {
        const updatedTable = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTable) {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.json(updatedTable);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/tables/:id', verifyToken, isAdmin,   async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        await table.deleteOne();
        res.json({ message: 'Table deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
