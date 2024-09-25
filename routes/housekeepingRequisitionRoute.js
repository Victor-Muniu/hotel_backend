const express = require('express');
const router = express.Router();
const HouseKeepingRequisition = require('../requisition/houseKeepingRequisition'); 
const Item = require('../store/item'); 
const Linens = require('../house_keeping/ready');

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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'procurement' && user.role !== 'house keeping')) {
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

router.post('/houseKeepingRequisitions', verifyToken, isAdmin, async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (quantity > item.quantity) {
            return res.status(400).json({ message: 'Requested quantity exceeds available quantity' });
        }

        item.quantity -= quantity;
        await item.save();

        const newRequisition = new HouseKeepingRequisition({
            itemID: item._id,
            quantity,
            unit,
            description,
            date,
            department,
            status
        });

        await newRequisition.save();
        res.status(201).json(newRequisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.patch('/houseKeepingRequisitions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const requisition = await HouseKeepingRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (quantity > item.quantity + requisition.quantity) {
            return res.status(400).json({ message: 'Requested quantity exceeds available quantity' });
        }

        item.quantity = item.quantity + requisition.quantity - quantity;
        await item.save();

        if (status === 'Approved') {
            
            let linens = await Linens.findOne({ name: item.name });

            if (linens) {
                
                linens.quantity += quantity;
                linens.value += item.unit_price * quantity;
            } else {
               
                linens = new Linens({
                    name: item.name,
                    description: item.description,
                    group: item.group,
                    unit_price: item.unit_price,
                    quantity: quantity,
                    spoilt: item.spoilt,
                    value: item.unit_price * quantity,
                    date: new Date()
                });
            }

            await linens.save();
        }

        requisition.itemID = item._id;
        requisition.quantity = quantity;
        requisition.unit = unit;
        requisition.description = description;
        requisition.date = date;
        requisition.department = department;
        requisition.status = status;

        await requisition.save();
        res.json(requisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/houseKeepingRequisitions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const requisition = await HouseKeepingRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        const item = await Item.findById(requisition.itemID);
        if (item) {
            item.quantity += requisition.quantity;
            await item.save();
        }

        await requisition.deleteOne();
        res.json({ message: 'Requisition deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/houseKeepingRequisitions', verifyToken, isAdmin, async (req, res) => {
    try {
        const requisitions = await HouseKeepingRequisition.find().populate('itemID');
        const populatedRequisitions = requisitions.map(req => ({
            ...req.toObject(),
            itemName: req.itemID.name
        }));
        res.json(populatedRequisitions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/houseKeepingRequisitions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const requisition = await HouseKeepingRequisition.findById(req.params.id).populate('itemID');
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }
        res.json({
            ...requisition.toObject(),
            itemName: requisition.itemID.name
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
