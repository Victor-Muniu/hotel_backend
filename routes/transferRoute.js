const express = require('express');
const router = express.Router();
const Transfer = require('../transfer/drinks');

// Get all transfer records
router.get('/transfers', async (req, res) => {
    try {
        const transfers = await Transfer.find();
        res.json(transfers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
