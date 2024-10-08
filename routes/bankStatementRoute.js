const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const Transaction = require('../accounts/transaction'); 
const BalanceSheet = require('../accounts/balancesheet')

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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


router.post('/transactions', verifyToken, isAdmin, async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).send(transaction);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/transactions', verifyToken, isAdmin, async (req, res) => {
    try {
        const transactions = await Transaction.find({});
        res.send(transactions);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/transactions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).send();
        }
        res.send(transaction);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/transactions/:id', verifyToken, isAdmin, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['date', 'value', 'particulars', 'transaction_cost', 'moneyOut', 'moneyIn', 'balance'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).send();
        }

        updates.forEach((update) => (transaction[update] = req.body[update]));
        await transaction.save();
        res.send(transaction);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/transactions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!transaction) {
            return res.status(404).send();
        }
        res.send(transaction);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/upload-excel', verifyToken, isAdmin, upload.single('file'), async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).send('No file uploaded.');
    }

    const dataBuffer = req.file.buffer;

    try {
        const workbook = xlsx.read(dataBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        const transactions = jsonData.map(row => ({
            date: row['Date'],
            value: row['Value'],
            particulars: row['Particulars'],
            transaction_cost: row['Transaction Cost'],
            moneyOut: row['Money Out'] ? parseFloat(row['Money Out']) : null,
            moneyIn: row['Money In'] ? parseFloat(row['Money In']) : null,
            balance: row['Balance'] ? parseFloat(row['Balance']) : null
        }));

        await Transaction.insertMany(transactions);

        const totalBalance = transactions.reduce((sum, transaction) => {
            return sum + (transaction.balance || 0);
        }, 0);

        const balanceSheetEntry = new BalanceSheet({
            name: 'Cash in Bank',
            category: 'Current Assets',
            amount: totalBalance,
            date: new Date()
        });

        await balanceSheetEntry.save();

        res.status(201).send({ transactions, balanceSheetEntry });
    } catch (error) {
        res.status(400).send(error.message);
    }
});


module.exports = router;
