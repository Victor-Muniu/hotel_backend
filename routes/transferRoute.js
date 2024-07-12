const express = require('express');
const router = express.Router();
const Transfer = require('../transfer/drinks');

router.get('/transfers', async (req, res) => {
    try {
        const transfers = await Transfer.find();
        res.json(transfers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/transfers/:id', async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }
        res.json(transfer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/transfers', async (req, res) => {
    const { name, description, group, unit_price, quantity, spoilt, value, date } = req.body;

    const newTransfer = new Transfer({
        name,
        description,
        group,
        unit_price,
        quantity,
        spoilt,
        value,
        date
    });

    try {
        const savedTransfer = await newTransfer.save();
        res.status(201).json(savedTransfer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.patch('/transfers/:id', async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }

        Object.keys(req.body).forEach(key => {
            transfer[key] = req.body[key];
        });

        const updatedTransfer = await transfer.save();
        res.json(updatedTransfer);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/transfers/:id', async (req, res) => {
    try {
        const transfer = await Transfer.findById(req.params.id);
        if (!transfer) {
            return res.status(404).json({ message: 'Transfer not found' });
        }

        await transfer.remove();
        res.json({ message: 'Transfer deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
