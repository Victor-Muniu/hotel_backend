const express = require('express')
const router = express.Router()
const ClubBill = require('../sales/clubBills')
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



router.get('/clubBills', verifyToken, isAdmin, async (req, res) => {
    try {
        const bills = await ClubBill.find();
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/clubBills/byStaff/:staffName', verifyToken, isAdmin, async (req, res) => {
    try {
        const bills = await ClubBill.find({ staffName: req.params.staffName });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/clubBills/:id', verifyToken, isAdmin, async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const updatedBill = await ClubBill.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedBill) {
            return res.status(404).json({ message: 'Club bill not found' });
        }
        if (updatedBill.status === 'Cleared') {

            const table = await Table.findById(updatedBill.tableId);

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

module.exports = router;