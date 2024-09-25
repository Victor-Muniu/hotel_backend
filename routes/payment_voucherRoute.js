const express = require('express');
const router = express.Router();
const PaymentVoucher = require('../accounts/payment_voucher');
const Staff = require('../models/staff');
const Creditors = require('../accounts/creditors');
const GeneralLedger = require('../accounts/general_lenger');
const TrialBalance = require('../accounts/trial_balance');


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

router.post('/payment-vouchers', verifyToken, isAdmin, async (req, res) => {
    try {
        const { creditorsId, amount, emp_no } = req.body;

        
        const staff = await Staff.findOne({ emp_no });
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        
        const newPaymentVoucher = new PaymentVoucher({
            creditorsId,
            amount,
            authorizedBy: staff._id  
        });

        await newPaymentVoucher.save();

        res.status(201).json(newPaymentVoucher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.patch('/payment-vouchers/:id/authorize', verifyToken, isAdmin, async (req, res) => {
    try {
        const { emp_no, password } = req.body;
        const { id } = req.params;
        const staff = await Staff.findOne({ emp_no });
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const rolesAllowed = ['super admin', 'CEO', 'general manager'];
        if (!rolesAllowed.includes(staff.role)) {
            return res.status(403).json({ message: 'Unauthorized role' });
        }

        if (staff.password !== password) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const paymentVoucher = await PaymentVoucher.findById(id);
        if (!paymentVoucher) {
            return res.status(404).json({ message: 'PaymentVoucher not found' });
        }

        paymentVoucher.status = 'Authorized';
        paymentVoucher.authorizationDate = new Date();
        await paymentVoucher.save();

        for (const creditorId of paymentVoucher.creditorsId) {
            await Creditors.findByIdAndDelete(creditorId);
            await GeneralLedger.deleteMany({ creditorsId: creditorId });
        }

        const currentYear = new Date().getFullYear();
        await TrialBalance.updateOne(
            { group_name: 'Creditors', Date: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) } },
            { $inc: { Credit: -paymentVoucher.amount } }
        );

        res.json(paymentVoucher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



router.get('/payment-vouchers/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const paymentVoucher = await PaymentVoucher.findById(id);
        if (!paymentVoucher) {
            return res.status(404).json({ message: 'PaymentVoucher not found' });
        }

        res.json(paymentVoucher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/payment-vouchers', verifyToken, isAdmin, async (req, res) => {
    try {
        const paymentVouchers = await PaymentVoucher.find();
        res.json(paymentVouchers);
    } catch (err) {
        
        res.status(400).json({ message: err.message });
    }
});
module.exports = router;
