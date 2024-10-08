const express = require('express');
const router = express.Router();
const Banquetting = require('../banquetting/banquetting');
const BanquettingInvoice = require('../banquetting/banquettingInvoice');
const Debtors = require('../accounts/debtors');
const GeneralLedger = require('../accounts/general_lenger');
const TrialBalance = require('../accounts/trial_balance'); 

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

async function updateMonthlyCreditor(creditor) {
    const { date, amount } = creditor;

    const creditorMonth = date.getMonth();
    const creditorYear = date.getFullYear();

    let ledgerEntry = await GeneralLedger.findOne({ category: `Debtors-${creditorYear}-${creditorMonth}` });

    if (!ledgerEntry) {
        ledgerEntry = new GeneralLedger({
            category: `Debtors`, 
            date: new Date(), 
            amount: amount,  
        });
    } else {
        ledgerEntry.amount += amount;  
    }

    await ledgerEntry.save();
}

async function updateTrialBalance(debitAmount) {
    const currentYear = new Date().getFullYear();
    let trialBalanceEntry = await TrialBalance.findOne({ group_name: 'Debtors', Date: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) } });

    if (!trialBalanceEntry) {
        trialBalanceEntry = new TrialBalance({
            group_name: 'Debtors',
            Debit: debitAmount,
            Credit: 0,
            Date: new Date()
        });
    } else {
        trialBalanceEntry.Debit += debitAmount;  
    }

    await trialBalanceEntry.save();
}

router.post('/debtors', verifyToken, isAdmin, async (req, res) => {
    try {
        const { booking_no } = req.body;

        console.log('Received booking_no:', booking_no);

        const banquetting = await Banquetting.findOne({ booking_no });

        console.log('Found Banquetting:', banquetting);

        if (!banquetting) {
            return res.status(404).json({ message: 'Banquetting not found' });
        }

        const banquettingInvoice = await BanquettingInvoice.findOne({ banquettingId: banquetting._id });

        console.log('Found BanquettingInvoice:', banquettingInvoice);

        if (!banquettingInvoice) {
            return res.status(404).json({ message: 'BanquettingInvoice not found' });
        }

        const newDebtor = new Debtors({ banquettingInvoiceId: banquettingInvoice._id });

        await newDebtor.save();

        await updateMonthlyCreditor({ date: new Date(), amount: banquettingInvoice.Totalamount });
        await updateTrialBalance(banquettingInvoice.Totalamount);

        res.status(201).json(newDebtor);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/debtors', verifyToken, isAdmin, async (req, res) => {
    try {
        const debtors = await Debtors.find().populate({
            path: 'banquettingInvoiceId',
            populate: {
                path: 'banquettingId',
                model: 'Banquetting'
            }
        });

        const response = debtors.map(debtor => {
            const banquetting = debtor.banquettingInvoiceId.banquettingId;
            const invoice = debtor.banquettingInvoiceId;
            return {
                booking_no: banquetting.booking_no,
                name: banquetting.name,
                workshopName: banquetting.workshopName,
                packs: invoice.packs,
                Totalamount: invoice.Totalamount
            };
        });

        res.json(response);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/debtors/:id', verifyToken, isAdmin, async (req, res) => {
    try { 
        const debtor = await Debtors.findById(req.params.id).populate('banquettingInvoiceId');
        if (!debtor) {
            return res.status(404).json({ message: 'Debtor not found' });
        }
        res.json(debtor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/debtors/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const updatedDebtor = await Debtors.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedDebtor) {
            return res.status(404).json({ message: 'Debtor not found' });
        }
        res.json(updatedDebtor);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/debtors/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const debtor = await Debtors.findById(id);
        if (!debtor) {
            return res.status(404).json({ message: 'Debtor not found' });
        }

        const banquettingInvoice = await BanquettingInvoice.findById(debtor.banquettingInvoiceId);
        if (!banquettingInvoice) {
            return res.status(404).json({ message: 'BanquettingInvoice not found' });
        }

        await GeneralLedger.deleteOne({ category: 'Debtors', date: banquettingInvoice.date, amount: banquettingInvoice.Totalamount });
        await TrialBalance.updateOne({ group_name: 'Debtors', Date: { $gte: new Date(new Date().getFullYear(), 0, 1), $lt: new Date(new Date().getFullYear() + 1, 0, 1) } }, { $inc: { Debit: -banquettingInvoice.Totalamount } });

        await debtor.deleteOne();

        res.json({ message: 'Debtor and corresponding ledger entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
