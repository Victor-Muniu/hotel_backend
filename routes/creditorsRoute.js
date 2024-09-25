const express = require('express');
const router = express.Router();
const Creditors = require('../accounts/creditors');
const TrialBalance = require('../accounts/trial_balance');
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

router.post('/creditors', verifyToken, isAdmin, async (req, res) => {
    try {
        const { vendor, date, amount } = req.body;

        const newCreditor = new Creditors({
            vendor,
            date,
            amount
        });

        const currentYear = new Date().getFullYear(); 

        let trialBalanceEntry = await TrialBalance.findOne({
            group_name: 'Creditors',
            Date: {
                $gte: new Date(currentYear, 0, 1),
                $lt: new Date(currentYear + 1, 0, 1)
            }
        });

        if (!trialBalanceEntry) {
            trialBalanceEntry = new TrialBalance({
                group_name: 'Creditors',
                Debit: 0,
                Credit: amount,
                Date: new Date()
            });
        } else {
            trialBalanceEntry.Credit += amount;  
        }

        await trialBalanceEntry.save();

        let balanceSheetEntry = await BalanceSheet.findOne({
            name: 'Short Term Loans',
            category: 'Short Term Liabilities',
            date: {
                $gte: new Date(currentYear, 0, 1),
                $lt: new Date(currentYear + 1, 0, 1)
            }
        });

        if (!balanceSheetEntry) {
            balanceSheetEntry = new BalanceSheet({
                name: 'Short Term Loans',
                category: 'Short Term Liabilities',
                amount: amount,
                date: new Date()
            });
        } else {
            balanceSheetEntry.amount += amount;
        }

        await balanceSheetEntry.save();

        await newCreditor.save();

        res.status(201).json(newCreditor);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/creditors', verifyToken, isAdmin, async (req, res) => {
    try {
        const creditors = await Creditors.find();
        res.json(creditors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/creditors/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const creditor = await Creditors.findById(req.params.id);
        if (!creditor) {
            return res.status(404).json({ message: 'Creditor not found' });
        }
        res.json(creditor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/creditors/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const deletedCreditor = await Creditors.findByIdAndDelete(req.params.id);
        if (!deletedCreditor) {
            return res.status(404).json({ message: 'Creditor not found' });
        }
        res.json({ message: 'Creditor deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
