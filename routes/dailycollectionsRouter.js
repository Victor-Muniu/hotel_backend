const express = require('express');
const router = express.Router();
const DailyCollections = require('../accounts/dailycollections');


function calculateTotalRevenue(float, total_sales, cash_paid_out) {
    return float + total_sales - cash_paid_out;
}

router.post('/dailycollections', async (req, res) => {
    try {
        const { date, float, cash_paid_out, total_sales, shift } = req.body;
        const total_revenue = calculateTotalRevenue(float, total_sales, cash_paid_out);

        const newDailyCollection = new DailyCollections({
            date,
            float,
            cash_paid_out,
            total_sales,
            total_revenue,
            shift
        });

        await newDailyCollection.save();
        res.status(201).json(newDailyCollection);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.get('/dailycollections', async (req, res) => {
    try {
        const dailyCollections = await DailyCollections.find();
        res.json(dailyCollections);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/dailycollections/:id', async (req, res) => {
    try {
        const dailyCollection = await DailyCollections.findById(req.params.id);
        if (!dailyCollection) {
            return res.status(404).json({ message: 'Daily collection not found' });
        }
        res.json(dailyCollection);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/dailycollections/:id', async (req, res) => {
    try {
        const updatedData = req.body;
        
        if (updatedData.float !== undefined || updatedData.total_sales !== undefined || updatedData.cash_paid_out !== undefined) {
            const dailyCollection = await DailyCollections.findById(req.params.id);
            if (!dailyCollection) {
                return res.status(404).json({ message: 'Daily collection not found' });
            }

            const float = updatedData.float !== undefined ? updatedData.float : dailyCollection.float;
            const total_sales = updatedData.total_sales !== undefined ? updatedData.total_sales : dailyCollection.total_sales;
            const cash_paid_out = updatedData.cash_paid_out !== undefined ? updatedData.cash_paid_out : dailyCollection.cash_paid_out;

            updatedData.total_revenue = calculateTotalRevenue(float, total_sales, cash_paid_out);
        }

        const updatedDailyCollection = await DailyCollections.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!updatedDailyCollection) {
            return res.status(404).json({ message: 'Daily collection not found' });
        }
        res.json(updatedDailyCollection);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a daily collection
router.delete('/dailycollections/:id', async (req, res) => {
    try {
        const deletedDailyCollection = await DailyCollections.findByIdAndDelete(req.params.id);
        if (!deletedDailyCollection) {
            return res.status(404).json({ message: 'Daily collection not found' });
        }
        res.json({ message: 'Daily collection deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
