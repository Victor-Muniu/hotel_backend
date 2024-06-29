const express = require('express');
const router = express.Router();
const BanquettingRequisition = require('../requisition/banquettingRequisition');
const Item = require('../store/item');

router.post('/banquettingRequisitions', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient quantity available' });
        }

        const newRequisition = new BanquettingRequisition({
            itemID: item._id,
            quantity,
            unit,
            description,
            date,
            department,
            status
        });

        await newRequisition.save();

        item.quantity -= quantity;
        await item.save();

        res.status(201).json(newRequisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.patch('/banquettingRequisitions/:id', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const updatedRequisition = await BanquettingRequisition.findByIdAndUpdate(req.params.id, {
            itemID: item._id,
            quantity,
            unit,
            description,
            date,
            department,
            status
        }, { new: true });

        res.json(updatedRequisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/banquettingRequisitions', async (req, res) => {
    try {
        const requisitions = await BanquettingRequisition.find().populate('itemID');
        res.json(requisitions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/banquettingRequisitions/:id', async (req, res) => {
    try {
        const requisition = await BanquettingRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        const item = await Item.findById(requisition.itemID);
        if (item) {
            item.quantity += requisition.quantity;
            await item.save();
        }

        await requisition.deleteOne();
        res.json({ message: 'Requisition deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
