const express = require('express');
const router = express.Router();
const Alcarte = require('../restaurant/alcarte'); 
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

router.get('/alcarte', verifyToken, isAdmin, async (req, res) => {
    try {
        const alcarteItems = await Alcarte.find();
        res.json(alcarteItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/alcarte/:id',verifyToken, isAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const updatedItem = await Alcarte.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
