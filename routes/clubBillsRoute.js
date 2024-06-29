const express = require('express')
const router = express.Router()
const ClubBill = require('../sales/clubBills')

router.get('/clubBills', async (req, res) => {
    try {
        const bills = await ClubBill.find();
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/clubBills/byStaff/:staffName', async (req, res) => {
    try {
        const bills = await ClubBill.find({ staffName: req.params.staffName });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;