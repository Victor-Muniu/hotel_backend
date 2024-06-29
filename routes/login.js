const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/staff'); // Import your user model

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
                id: user._id,
                role: user.role
            }
        };

        jwt.sign(payload, 'your_secret_key', { expiresIn: '1h' }, (err, token) => {
            if (err) {
                throw err;
            }
            res.json({
                token,
                user: {
                    id: user._id,
                    fname: user.fname,
                    lname: user.lname,
                    role: user.role,
                    email: user.email,
                    emp_no: user.emp_no
                }
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
