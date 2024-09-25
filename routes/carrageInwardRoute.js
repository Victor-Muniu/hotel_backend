const express = require('express');
const router = express.Router();
const CarrageInward = require('../accounts/carriage_Inwards');
const Expense = require('../accounts/expense');
const GeneralLedger = require('../accounts/general_lenger');

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
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'accounts' && user.role !== 'procurement')){
            console.log('User is not admin');
            return res.status(403).json({message: "Unauthorized: Only admin users can perform this action"});
            
        }
        console.log('User is Admin')
    } catch (err){
        res.status(500).json({message: err.message});
    }
}



router.post('/carrage-inwards', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, date, amount } = req.body;

        const newCarrageInward = new CarrageInward({ name, date, amount });
        await newCarrageInward.save();

        const newExpense = new Expense({ category: name, amount, date });
        await newExpense.save();

        const newGeneralLedger = new GeneralLedger({ category: name, amount, date });
        await newGeneralLedger.save();

        res.status(201).json(newCarrageInward);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/carrage-inwards', verifyToken, isAdmin, async (req, res) => {
    try {
        const carrageInwards = await CarrageInward.find();
        res.json(carrageInwards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/carrage-inwards/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const carrageInward = await CarrageInward.findById(req.params.id);
        if (!carrageInward) {
            return res.status(404).json({ message: 'Carrage Inward not found' });
        }
        res.json(carrageInward);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/carrage-inwards/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const carrageInward = await CarrageInward.findById(req.params.id);
        if (!carrageInward) {
            return res.status(404).json({ message: 'Carrage Inward not found' });
        }

        const { name, date, amount } = req.body;
        if (name !== undefined) carrageInward.name = name;
        if (date !== undefined) carrageInward.date = date;
        if (amount !== undefined) carrageInward.amount = amount;

        await carrageInward.save();

        await Expense.updateMany({ category: name }, { amount, date });
        await GeneralLedger.updateMany({ category: name }, { amount, date });

        res.json(carrageInward);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/carrage-inwards/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const carrageInward = await CarrageInward.findById(req.params.id);
        if (!carrageInward) {
            return res.status(404).json({ message: 'Carrage Inward not found' });
        }

        await carrageInward.deleteOne();

        await Expense.deleteMany({ category: carrageInward.name, date: carrageInward.date, amount: carrageInward.amount });
        await GeneralLedger.deleteMany({ category: carrageInward.name, date: carrageInward.date, amount: carrageInward.amount });

        res.json({ message: 'Carrage Inward deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
