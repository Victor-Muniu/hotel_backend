const express = require('express');
const jwt = require('jsonwebtoken');
const Staff = require('../models/staff.js');
const Department = require('../models/department.js');

const router = express.Router();

// Middleware to verify JWT token
function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        req.userId = decoded.user.emp_no;
        console.log('User ID:', req.userId); // Add this line for debugging
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
}


// Middleware to check if user is admin
async function isAdmin(req, res, next) {
    try {
        const user = await Staff.findOne({ emp_no: req.userId });
        console.log('User:', user); // Add this line for debugging
        if (!user || user.role !== 'admin') {
            console.log('User is not admin'); // Add this line for debugging
            return res.status(403).json({ message: 'Unauthorized: Only admin users can perform this action' });
        }
        console.log('User is admin'); // Add this line for debugging
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// POST a new department (Only accessible to admin users)
router.post('/departments', verifyToken, isAdmin, async (req, res) => {
    const { name, emp_no } = req.body;

    try {
        // Find staff by emp_no
        const staff = await Staff.findOne({ emp_no });
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const department = new Department({
            name,
            staff_id: staff._id
        });

        const newDepartment = await department.save();
        res.status(201).json(newDepartment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PATCH update a department (Only accessible to admin users)
router.patch('/departments/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        department.name = req.body.name;
        await department.save();
        res.json(department);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a department (Only accessible to admin users)
router.delete('/departments/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        await department.deleteOne();
        res.json({ message: 'Department deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET one department by id (Accessible to all users)
router.get('/departments/:id', async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        if (!department) {
            return res.status(404).json({ message: 'Department not found' });
        }
        res.json(department);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
