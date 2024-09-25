const express = require('express');
const router = express.Router();
const CheffsLadder = require('../food_production/chefsLadder');

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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'food production')) {
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

function calculateStocks(doc) {
    const opening_stock = Number(doc.opening_stock);
    const issued = Number(doc.issued);
    const RT = Number(doc.RT);
    const sold = Number(doc.sold);

    const total = opening_stock + issued;
    const closing_stock = total - RT - sold;

    return { total, closing_stock };
}

router.post('/cheffsLadder', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, unit, date, opening_stock, issued, RT, sold, shift, remarks } = req.body;

     
        const numericData = {
            opening_stock: Number(opening_stock),
            issued: Number(issued),
            RT: Number(RT),
            sold: Number(sold)
        };

        const { total, closing_stock } = calculateStocks(numericData);

        const newLadder = new CheffsLadder({
            name,
            unit,
            date,
            opening_stock: numericData.opening_stock,
            issued: numericData.issued,
            RT: numericData.RT,
            sold: numericData.sold,
            shift,
            remarks,
            total,
            closing_stock
        });

        await newLadder.save();
        res.status(201).json(newLadder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/cheffsLadder', verifyToken, isAdmin, async (req, res) => {
    try {
        const ladders = await CheffsLadder.find();
        res.json(ladders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/cheffsLadder/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const ladder = await CheffsLadder.findById(req.params.id);
        if (!ladder) return res.status(404).json({ message: 'CheffsLadder not found' });
        res.json(ladder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/cheffsLadder/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const ladder = await CheffsLadder.findById(req.params.id);
        if (!ladder) return res.status(404).json({ message: 'CheffsLadder not found' });

        Object.assign(ladder, {
            ...req.body,
            opening_stock: Number(req.body.opening_stock),
            issued: Number(req.body.issued),
            RT: Number(req.body.RT),
            sold: Number(req.body.sold)
        });

        const { total, closing_stock } = calculateStocks(ladder);
        ladder.total = total;
        ladder.closing_stock = closing_stock;

        const updatedLadder = await ladder.save();
        res.json(updatedLadder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/cheffsLadder/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const ladder = await CheffsLadder.findById(req.params.id);
        if (!ladder) return res.status(404).json({ message: 'CheffsLadder not found' });

        await ladder.deleteOne();
        res.json({ message: 'CheffsLadder deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
