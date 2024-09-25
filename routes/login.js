const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/staff');

const router = express.Router();

router.post('/login', async (req, res) => {
    const { emp_no, password } = req.body;

    try {
        const user = await User.findOne({ emp_no });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const payload = {
            user: {
                emp_no: user.emp_no, 
                role: user.role
            }
        };
        
        jwt.sign(payload, 'your_secret_key', { expiresIn: '1h' }, (err, token) => {
            if (err) {
                throw err;
            }
        
            res.cookie('token', token, {
                httpOnly: false, 
                secure: process.env.NODE_ENV === 'production', 
                maxAge: 3600000 
            });
        
            res.json({
                user: {
                    emp_no: user.emp_no,
                    fname: user.fname,
                    lname: user.lname,
                    role: user.role,
                    email: user.email
                }
            });
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post('/logout', (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/change-password', async (req, res) => {
    const { emp_no, currentPassword, newPassword } = req.body;

    try {
    
        const user = await User.findOne({ emp_no });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.password !== currentPassword) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

       
        user.password = newPassword;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
