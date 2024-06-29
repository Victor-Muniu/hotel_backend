const express = require('express')
const router = express.Router()
const RestaurantBill =require('../sales/restaurantBills')

router.get('/restaurantBills', async (req, res) => {
    try {
        const bills = await RestaurantBill.find().populate('restaurantOrderId');
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/restaurantBills/byStaff/:staffName', async (req, res) => {
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

module.exports =router