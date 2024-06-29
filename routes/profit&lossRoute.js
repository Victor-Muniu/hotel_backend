const express = require('express');
const router = express.Router();
const ProfitLoss = require('../accounts/profit&loss'); // Adjust the path as per your file structure

router.get('/profitloss', async (req, res) => {
    try {
        const profitLossEntries = await ProfitLoss.find();
        res.json(profitLossEntries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
