const express = require('express');
const router = express.Router();
const Sales = require('../accounts/sales'); 

router.get('/sales', async (req, res) => {
    try {
        const sales = await Sales.find().populate('ammenitiesId').populate('clubOrderId').populate('restaurantOrderId');
        res.json(sales);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;