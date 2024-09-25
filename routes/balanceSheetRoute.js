const express = require('express');
const router = express.Router();
const BalanceSheet = require('../accounts/balancesheet');
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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'accounts' && user.role !== 'CEO')) {
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

router.post('/balancesheet', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, category, amount, date } = req.body;

        if (!name || !category || !amount || !date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newBalanceSheetEntry = new BalanceSheet({
            name,
            category,
            amount,
            date
        });

        await newBalanceSheetEntry.save();
        res.status(201).json(newBalanceSheetEntry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/balancesheet', verifyToken, isAdmin, async (req, res) => {
    try {
        const balanceSheetEntries = await BalanceSheet.find();
        res.json(balanceSheetEntries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/balancesheet/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const balanceSheetEntry = await BalanceSheet.findById(req.params.id);
        if (!balanceSheetEntry) {
            return res.status(404).json({ message: 'Balance sheet entry not found' });
        }
        res.json(balanceSheetEntry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/balancesheet/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const updates = req.body;

        if (updates.name !== undefined || updates.category !== undefined || updates.amount !== undefined || updates.date !== undefined) {
            const balanceSheetEntry = await BalanceSheet.findById(req.params.id);
            if (!balanceSheetEntry) {
                return res.status(404).json({ message: 'Balance sheet entry not found' });
            }

            Object.assign(balanceSheetEntry, updates);
            await balanceSheetEntry.save();

            res.json(balanceSheetEntry);
        } else {
            res.status(400).json({ message: 'No valid fields to update' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/balancesheet/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const deletedBalanceSheetEntry = await BalanceSheet.findByIdAndDelete(req.params.id);
        if (!deletedBalanceSheetEntry) {
            return res.status(404).json({ message: 'Balance sheet entry not found' });
        }
        res.json({ message: 'Balance sheet entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
