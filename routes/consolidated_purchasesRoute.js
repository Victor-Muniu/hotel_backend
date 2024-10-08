const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const Consolidated_purchases = require('../accounts/consolidated_purchases');
const TrialBalance = require('../accounts/trial_balance');
const ProfitLoss = require('../accounts/profit&loss');
const Item = require('../store/item');
const Creditors = require('../accounts/creditors');
const GeneralLeger = require('../accounts/general_lenger'); 
const BalanceSheet = require('../accounts/balancesheet');
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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'accounts' && user.role !== 'CEO' && user.role !== 'procurement')) {
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

router.post('/consolidated-purchases', verifyToken, isAdmin, async (req, res) => {
    try {
        const { date, amount, vendor } = req.body;
        const newEntry = new Consolidated_purchases({ date, amount, vendor });
        await newEntry.save();

        await updateFinancials('Purchases', amount, new Date(date), 'debit');

        const creditorsEntry = new Creditors({
            vendor: req.body.vendor, 
            date: new Date(date),
            amount: amount
        });
        await creditorsEntry.save();

        const generalLegerEntry = new GeneralLeger({
            category: 'Creditors',
            date: new Date(date),
            amount: amount
        });
        await generalLegerEntry.save();

        await updateBalanceSheet('Short Term Loans', 'Short Term Liabilities', amount, new Date(date));

        res.status(201).json(newEntry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/consolidated-purchases', verifyToken, isAdmin, async (req, res) => {
    try {
        const entries = await Consolidated_purchases.find();
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/consolidated-purchases/:id', async (req, res) => {
    try {
        const entry = await Consolidated_purchases.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Consolidated purchase entry not found' });
        }
        res.json(entry);
    } catch (err) {
        res.status({ message: err.message });
    }
});

router.patch('/consolidated-purchases/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const updatedEntry = await Consolidated_purchases.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEntry) {
            return res.status(404).json({ message: 'Consolidated purchase entry not found' });
        }
        res.json(updatedEntry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/consolidated-purchases/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const deletedEntry = await Consolidated_purchases.findByIdAndDelete(req.params.id);
        if (!deletedEntry) {
            return res.status(404).json({ message: 'Consolidated purchase entry not found' });
        }
        res.json({ message: 'Consolidated purchase entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/upload-consolidated-purchases', verifyToken, isAdmin, upload.single('file'), async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).send('No file uploaded.');
    }

    const dataBuffer = req.file.buffer;

    try {
        const workbook = xlsx.read(dataBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        let totalAmount = 0;
        const vendors = new Set();

        for (const row of jsonData.slice(1)) {
            totalAmount += Number(row[4]); 
            vendors.add(row[5]);
        }

        const vendorsArray = Array.from(vendors);

        const transactions = jsonData.slice(1).map(row => ({
            date: parseExcelDate(row[1]), 
            amount: Number(row[4]),
            vendor: row[5], 
        }));
        transactions.forEach(transaction => {
            console.log(`Date: ${transaction.date}`);
        });

        for (const transaction of transactions) {
            const newEntry = new Consolidated_purchases(transaction);
            await newEntry.save();
            await updateFinancials('Purchases', transaction.amount, transaction.date, 'debit');

            const creditorsEntry = new Creditors({
                vendor: transaction.vendor,
                date: new Date(transaction.date),
                amount: transaction.amount
            });
            await creditorsEntry.save();

            const generalLegerEntry = new GeneralLeger({
                category: 'Creditors',
                date: new Date(transaction.date),
                amount: transaction.amount
            });
            await generalLegerEntry.save();

            await updateBalanceSheet('Short Term Loans', 'Short Term Liabilities', transaction.amount, transaction.date);
        }

        console.log("Transactions saved and financials updated successfully.");
        res.status(201).json({ consolidatedPurchases: transactions, totalAmount });
    } catch (error) {
        res.status(400).send(error.message);
    }
});

function parseExcelDate(excelDate) {
    const excelTimestamp = Number(excelDate);
    return new Date((excelTimestamp - (25567 + 2)) * 86400 * 1000);
}

router.post('/upload-items', verifyToken, isAdmin, upload.single('file'), async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).send('No file uploaded.');
    }

    const dataBuffer = req.file.buffer;

    try {
        const workbook = xlsx.read(dataBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        const items = jsonData.slice(1).map(row => ({
            name: row[0],
            description: '',
            group: '',
            unit_price: Number(row[3]),
            quantity: Number(row[2]),
            date: new Date(row[1])
        }));

        for (const item of items) {
            let existingItem = await Item.findOne({ name: item.name });
            if (existingItem) {
                existingItem.quantity += item.quantity;
                existingItem.value = existingItem.quantity * existingItem.unit_price;
                existingItem.date = item.date;
                await existingItem.save();
            } else {
                item.value = item.quantity * item.unit_price;
                const newItem = new Item(item);
                await newItem.save();
            }
        }

        console.log("Items saved or updated successfully.");
        res.status(201).send(items);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

async function updateFinancials(groupName, amount, date, transactionType) {
    const year = date.getFullYear();

    let trialBalanceEntry = await TrialBalance.findOne({ group_name: groupName, Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } });
    let profitLossEntry = await ProfitLoss.findOne({ group_name: groupName, Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } });

    if (!trialBalanceEntry) {
        trialBalanceEntry = new TrialBalance({
            group_name: groupName,
            Debit: transactionType === 'debit' ? amount : 0,
            Credit: transactionType === 'credit' ? amount : 0,
            Date: new Date(year, 0, 1)
        });
    } else {
        trialBalanceEntry.Debit += transactionType === 'debit' ? amount : 0;
        trialBalanceEntry.Credit += transactionType === 'credit' ? amount : 0;
    }

    if (!profitLossEntry) {
        profitLossEntry = new ProfitLoss({
            group_name: groupName,
            Debit: transactionType === 'debit' ? amount : 0,
            Credit: transactionType === 'credit' ? amount : 0,
            Date: new Date(year, 0, 1)
        });
    } else {
        profitLossEntry.Debit += transactionType === 'debit' ? amount : 0;
        profitLossEntry.Credit += transactionType === 'credit' ? amount : 0;
    }

    await trialBalanceEntry.save();
    await profitLossEntry.save();
}

async function updateBalanceSheet(name, category, amount, date) {
    let balanceSheetEntry = await BalanceSheet.findOne({ name, category });
    if (balanceSheetEntry) {
        balanceSheetEntry.amount += amount;
    } else {
        balanceSheetEntry = new BalanceSheet({
            name,
            category,
            amount,
            date
        });
    }
    await balanceSheetEntry.save();
}

module.exports = router;
