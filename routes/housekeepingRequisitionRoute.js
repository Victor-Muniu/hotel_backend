const express = require('express');
const router = express.Router();
const HouseKeepingRequisition = require('../models/houseKeepingRequisition'); 
const Item = require('../models/item'); 

router.post('/houseKeepingRequisitions', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (quantity > item.quantity) {
            return res.status(400).json({ message: 'Requested quantity exceeds available quantity' });
        }

        item.quantity -= quantity;
        await item.save();

        const newRequisition = new HouseKeepingRequisition({
            itemID: item._id,
            quantity,
            unit,
            description,
            date,
            department,
            status
        });

        await newRequisition.save();
        res.status(201).json(newRequisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.patch('/houseKeepingRequisitions/:id', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const requisition = await HouseKeepingRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (quantity > item.quantity + requisition.quantity) {
            return res.status(400).json({ message: 'Requested quantity exceeds available quantity' });
        }

        item.quantity = item.quantity + requisition.quantity - quantity;
        await item.save();

        requisition.itemID = item._id;
        requisition.quantity = quantity;
        requisition.unit = unit;
        requisition.description = description;
        requisition.date = date;
        requisition.department = department;
        requisition.status = status;

        await requisition.save();
        res.json(requisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/houseKeepingRequisitions/:id', async (req, res) => {
    try {
        const requisition = await HouseKeepingRequisition.findById(req.params.id);
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

module.exports = router