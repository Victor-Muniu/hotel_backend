const express = require('express');
const router = express.Router();
const Assets = require('../accounts/assets');
const GeneralLedger = require('../accounts/general_lenger');
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
async function updatedFinancials(asset) {
    const { amount, category } = asset;
    let ledgerEntry = await GeneralLedger.findOne({ category });

    if (!ledgerEntry) {
        ledgerEntry = new GeneralLedger({
            category,
            date: new Date(),
            amount,
        });
    } else {
        ledgerEntry.amount += amount;
    }

    await ledgerEntry.save();
}

async function updateBalanceSheet(asset) {
    const { name, category, amount } = asset;
    const recordName =  name;

    let balanceSheetEntry = await BalanceSheet.findOne({ name: recordName, name });

    if (!balanceSheetEntry) {
        balanceSheetEntry = new BalanceSheet({
            name: 'Fixed Assets',
            category,
            amount,
            date: new Date()
        });
    } else {
        balanceSheetEntry.amount += amount;
    }

    await balanceSheetEntry.save();
}

router.post('/assets', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, group, category, issued, stored, spoilt, price } = req.body;
        const quantity = issued + stored + spoilt;
        const value = quantity * price;
        const amount = value;

        const newAsset = new Assets({
            name,
            group,
            category,
            quantity,
            issued,
            stored,
            spoilt,
            price,
            amount,
            value
        });

        await newAsset.save();
        await updatedFinancials(newAsset);
        await updateBalanceSheet(newAsset);
        res.status(201).json(newAsset);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/assets', verifyToken, isAdmin, async (req, res) => {
    try {
        const assets = await Assets.find();
        res.json(assets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/assets/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const asset = await Assets.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json(asset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/assets/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const updatedData = req.body;

        if (updatedData.issued !== undefined || updatedData.stored !== undefined || updatedData.spoilt !== undefined || updatedData.price !== undefined) {
            const asset = await Assets.findById(req.params.id);
            if (!asset) {
                return res.status(404).json({ message: 'Asset not found' });
            }

            const issued = updatedData.issued !== undefined ? updatedData.issued : asset.issued;
            const stored = updatedData.stored !== undefined ? updatedData.stored : asset.stored;
            const spoilt = updatedData.spoilt !== undefined ? updatedData.spoilt : asset.spoilt;
            const price = updatedData.price !== undefined ? updatedData.price : asset.price;

            updatedData.quantity = issued + stored + spoilt;
            updatedData.value = updatedData.quantity * price;
            updatedData.amount = updatedData.value;  
            
        }

        const updatedAsset = await Assets.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!updatedAsset) {
            return res.status(404).json({ message: 'Asset not found' });
        }


        
        await updatedFinancials(updatedAsset);
        await updateBalanceSheet(updatedAsset);

        res.json(updatedAsset);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



router.delete('/assets/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const deletedAsset = await Assets.findByIdAndDelete(req.params.id);
        if (!deletedAsset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json({ message: 'Asset deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
