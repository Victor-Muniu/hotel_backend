const express = require('express');
const router = express.Router();
const FoodProductionRequisition = require('../requisition/foodproductionRequisition');
const Item = require('../store/item');
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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'procurement' && user.role !== 'food production')) {
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


router.post('/foodProductionRequisitions', verifyToken, isAdmin, async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient quantity available' });
        }

        const newRequisition = new FoodProductionRequisition({
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

router.patch('/foodProductionRequisitions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const requisition = await FoodProductionRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Food production requisition not found' });
        }

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (status === 'Approved') {
            if (item.quantity < quantity) {
                return res.status(400).json({ message: 'Insufficient quantity in stock' });
            }

            const today = new Date().toISOString().split('T')[0]; 

            let cheffsLadder = await CheffsLadder.findOne({ name: item.name, date: today });

            if (cheffsLadder) {
                
                cheffsLadder.issued += quantity;
                cheffsLadder.total = cheffsLadder.opening_stock + cheffsLadder.issued;
                cheffsLadder.closing_stock = cheffsLadder.total - cheffsLadder.RT - cheffsLadder.sold;
            } else {
                // Create new entry
                cheffsLadder = new CheffsLadder({
                    name: item.name,
                    unit: item.unit || 'default unit',
                    opening_stock: item.quantity,
                    issued: quantity,
                    total: item.quantity + quantity,
                    RT: 0, 
                    sold: 0, 
                    closing_stock: item.quantity + quantity, 
                    remarks: 'No Remarks', 
                    date: today,
                    shift: 'Day', 
                });
            }

            await cheffsLadder.save();

         
            item.quantity -= quantity;
            await item.save();
        }

        if (itemName) requisition.itemID = item._id;
        if (quantity) requisition.quantity = quantity;
        if (unit) requisition.unit = unit;
        if (description) requisition.description = description;
        if (date) requisition.date = date;
        if (department) requisition.department = department;
        if (status) requisition.status = status;

        const updatedRequisition = await requisition.save();
        res.json(updatedRequisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/foodProductionRequisitions', verifyToken, isAdmin, async (req, res) => {
    try {
        const requisitions = await FoodProductionRequisition.find().populate('itemID');
        const populatedRequisitions = requisitions.map(req => ({
            ...req.toObject(),
            itemName: req.itemID.name
        }));
        res.json(populatedRequisitions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/foodProductionRequisitions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const requisition = await FoodProductionRequisition.findById(req.params.id).populate('itemID');
        if (!requisition) {
            return res.status(404).json({ message: 'Food production requisition not found' });
        }
        res.json({
            ...requisition.toObject(),
            itemName: requisition.itemID.name
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/foodProductionRequisitions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const requisition = await FoodProductionRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Food production requisition not found' });
        }

        const item = await Item.findById(requisition.itemID);
        if (item) {
            item.quantity += requisition.quantity;
            await item.save();
        }

        await requisition.deleteOne();
        res.json({ message: 'Food production requisition deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
