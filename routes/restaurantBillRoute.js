const express = require('express')
const router = express.Router()
const RestaurantBill =require('../sales/restaurantBills')
const Table = require('../models/table')

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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'service' && user.role !== 'front office')) {
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




router.get('/restaurantBills', verifyToken, isAdmin, async (req, res) => {
    try {
        const bills = await RestaurantBill.find().populate('restaurantOrderId');
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/restaurantBills/byStaff/:staffName', verifyToken, isAdmin, async (req, res) => {
    try {
        const staffName = req.params.staffName;
        const bills = await RestaurantBill.find({ staffName }).populate('restaurantOrderId');

        if (bills.length === 0) {
            return res.status(404).json({ message: 'No bills found for the given staff name' });
        }

        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});





router.patch('/restaurantBills/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const updatedBill = await RestaurantBill.findByIdAndUpdate(id, updates, { new: true }).populate('restaurantOrderId');

        if (!updatedBill) {
            return res.status(404).json({ message: 'Restaurant bill not found' });
        }
        if (updatedBill.status === 'Cleared' || updatedBill.status === 'cleared') {
        
            const table = await Table.findById(updatedBill.restaurantOrderId.tableId);

            if (table) {
                
                table.status = 'Available';
                await table.save();
            }
        }

        res.json(updatedBill);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports =router