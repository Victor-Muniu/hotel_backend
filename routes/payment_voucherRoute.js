const express = require('express');
const router = express.Router();
const PaymentVoucher = require('../accounts/payment_voucher');
const Staff = require('../models/staff');
const Creditors = require('../accounts/creditors');
const GeneralLedger = require('../accounts/general_lenger');
const TrialBalance = require('../accounts/trial_balance');

router.post('/payment-vouchers', async (req, res) => {
    try {
        const { creditorsId, amount, authorizedBy } = req.body;

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

router.patch('/payment-vouchers/:id/authorize', async (req, res) => {
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



router.get('/payment-vouchers/:id', async (req, res) => {
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

module.exports = router;
