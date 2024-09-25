const express = require('express');
const router = express.Router();
const Sales = require('../accounts/sales'); 

router.get('/sales', async (req, res) => {
    try {
        const sales = await Sales.find()
            .populate('ammenitiesId')
            .populate('clubOrderId')
            .populate('restaurantOrderId')
            .populate('reservationsBillsId');
        
        if (!sales.length) {
            return res.status(404).json({ message: 'No sales data found' });
        }

        res.json(sales);  // Send the data as a response
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
