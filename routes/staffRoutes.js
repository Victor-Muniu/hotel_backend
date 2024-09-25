const express = require('express');

const router = express.Router();
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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'accounts')) {
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



router.get('/staff', verifyToken, isAdmin, async (req, res) => {
    try {
        const staff = await Staff.find();
        res.json(staff);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/staff/:id',  verifyToken, isAdmin, getStaff, (req, res) => {
    res.json(res.staff);
});


router.post('/staff',  verifyToken, isAdmin, async (req, res) => {
    const staff = new Staff({
        fname: req.body.fname,
        lname: req.body.lname,
        role: req.body.role,
        email: req.body.email,
        password: req.body.password,
        emp_no: req.body.emp_no
    });

    try {
        const newStaff = await staff.save();
        res.status(201).json(newStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.patch('/staff/:id',  verifyToken, isAdmin, getStaff, async (req, res) => {
    
    if (req.body.email != null) {
        res.staff.email = req.body.email;
    }
   

    try {
        const updatedStaff = await res.staff.save();
        res.json(updatedStaff);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/staff/:id',  verifyToken, isAdmin, getStaff, async (req, res) => {
    try {
        await res.staff.deleteOne();
        res.json({ message: 'Staff member deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function getStaff(req, res, next) {
    let staff;
    try {
        staff = await Staff.findById(req.params.id);
        if (staff == null) {
            return res.status(404).json({ message: 'Staff member not found' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.staff = staff;
    next();
}

module.exports = router;