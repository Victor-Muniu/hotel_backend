const express = require('express');
const router = express.Router();
const DailyCollections = require('../accounts/dailycollections');
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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'accounts' && user.role !== 'front office')) {
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

function calculateTotalRevenue({ float, total_sales, cash_paid_out }) {
    return float + total_sales - cash_paid_out;
}

router.post('/dailycollections', verifyToken, isAdmin, async (req, res) => {
    try {
        const { date, float, cash_paid_out, mpesa, cash, pesa_pal, equity, cheque, shift } = req.body;

        if (date === undefined || float === undefined || cash_paid_out === undefined || mpesa === undefined || cash === undefined || pesa_pal === undefined || equity === undefined || cheque === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const total_sales = mpesa + cash + pesa_pal + equity + cheque;
        const total_revenue = calculateTotalRevenue({ float, total_sales, cash_paid_out });

        const newDailyCollection = new DailyCollections({
            date,
            float,
            cash_paid_out,
            mpesa,
            cash,
            pesa_pal,
            equity,
            cheque,
            total_sales,
            total_revenue,
            shift
        });

        await newDailyCollection.save();

       
        await BalanceSheet.deleteOne({ name: 'Cash At Hand', category: 'Current Assets', date: date });

        
        const newBalanceSheetEntry = new BalanceSheet({
            name: 'Cash At Hand',
            category: 'Current Assets',
            amount: cash,
            date: date
        });

        await newBalanceSheetEntry.save();

        res.status(201).json(newDailyCollection);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/dailycollections',  async (req, res) => {
    try {
        const dailyCollections = await DailyCollections.find();
        res.json(dailyCollections);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/dailycollections/:id',  async (req, res) => {
    try {
        const dailyCollection = await DailyCollections.findById(req.params.id);
        if (!dailyCollection) {
            return res.status(404).json({ message: 'Daily collection not found' });
        }
        res.json(dailyCollection);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/dailycollections/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const updates = req.body;

        if (updates.float !== undefined || updates.mpesa !== undefined || updates.cash !== undefined || updates.pesa_pal !== undefined || updates.equity !== undefined || updates.cheque !== undefined || updates.cash_paid_out !== undefined) {
            const dailyCollection = await DailyCollections.findById(req.params.id);
            if (!dailyCollection) {
                return res.status(404).json({ message: 'Daily collection not found' });
            }

            const updatedData = {
                float: updates.float !== undefined ? updates.float : dailyCollection.float,
                mpesa: updates.mpesa !== undefined ? updates.mpesa : dailyCollection.mpesa,
                cash: updates.cash !== undefined ? updates.cash : dailyCollection.cash,
                pesa_pal: updates.pesa_pal !== undefined ? updates.pesa_pal : dailyCollection.pesa_pal,
                equity: updates.equity !== undefined ? updates.equity : dailyCollection.equity,
                cheque: updates.cheque !== undefined ? updates.cheque : dailyCollection.cheque,
                cash_paid_out: updates.cash_paid_out !== undefined ? updates.cash_paid_out : dailyCollection.cash_paid_out,
                total_sales: dailyCollection.total_sales
            };

            updatedData.total_sales = updatedData.mpesa + updatedData.cash + updatedData.pesa_pal + updatedData.equity + updatedData.cheque;
            updatedData.total_revenue = calculateTotalRevenue(updatedData);

            Object.assign(dailyCollection, updatedData);
        }

        const updatedDailyCollection = await DailyCollections.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!updatedDailyCollection) {
            return res.status(404).json({ message: 'Daily collection not found' });
        }
        res.json(updatedDailyCollection);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/dailycollections/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const deletedDailyCollection = await DailyCollections.findByIdAndDelete(req.params.id);
        if (!deletedDailyCollection) {
            return res.status(404).json({ message: 'Daily collection not found' });
        }
        res.json({ message: 'Daily collection deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
