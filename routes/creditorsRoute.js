const express = require('express');
const router = express.Router();
const Creditors = require('../accounts/creditors');



router.get('/creditors', async (req, res) => {
    try {
        const creditors = await Creditors.find();
        res.json(creditors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/creditors/:id', async (req, res) => {
    try {
        const creditor = await Creditors.findById(req.params.id);
        if (!creditor) {
            return res.status(404).json({ message: 'Creditor not found' });
        }
        res.json(creditor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/creditors/:id', async (req, res) => {
    try {
        const deletedCreditor = await Creditors.findByIdAndDelete(req.params.id);
        if (!deletedCreditor) {
            return res.status(404).json({ message: 'Creditor not found' });
        }
        res.json({ message: 'Creditor deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
