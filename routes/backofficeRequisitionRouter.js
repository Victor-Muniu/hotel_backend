const express = require('express');
const router = express.Router();
const BackOfficeRequisition = require('../requisition/backOffice');
const Item = require('../store/item');
const Back2 = require('../reservations/back2');

router.post('/backOfficeRequisitions', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient quantity available' });
        }

        const newRequisition = new BackOfficeRequisition({
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

router.patch('/backOfficeRequisitions/:id', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, department, status, date } = req.body;

        const requisition = await BackOfficeRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Back office requisition not found' });
        }

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (status === 'Approved') {
            if (item.quantity < quantity) {
                return res.status(400).json({ message: 'Insufficient quantity in stock' });
            }

            let back2 = await Back2.findOne({ name: item.name });

            if (back2) {
                back2.quantity += quantity;
                back2.value += item.unit_price * quantity;
            } else {
                back2 = new Back2({
                    name: item.name,
                    description: item.description,
                    group: item.group,
                    unit_price: item.unit_price,
                    quantity: quantity,
                    spoilt: item.spoilt,
                    value: item.unit_price * quantity,
                    date: new Date()
                });
            }

            await back2.save();

            item.quantity -= quantity;
            await item.save();
        }

        if (itemName) requisition.itemID = item._id;
        if (quantity) requisition.quantity = quantity;
        if (unit) requisition.unit = unit;
        if (description) requisition.description = description;
        if (date) requisition.date = date;
        if (department) requisition.department = department;
        if (status) requisition.status = status;

        const updatedRequisition = await requisition.save();
        res.json(updatedRequisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/backOfficeRequisitions', async (req, res) => {
    try {
        const requisitions = await BackOfficeRequisition.find().populate('itemID');
        const populatedRequisitions = requisitions.map(req => ({
            ...req.toObject(),
            itemName: req.itemID.name
        }));
        res.json(populatedRequisitions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/backOfficeRequisitions/:id', async (req, res) => {
    try {
        const requisition = await BackOfficeRequisition.findById(req.params.id).populate('itemID');
        if (!requisition) {
            return res.status(404).json({ message: 'Back office requisition not found' });
        }
        res.json({
            ...requisition.toObject(),
            itemName: requisition.itemID.name
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/backOfficeRequisitions/:id', async (req, res) => {
    try {
        const requisition = await BackOfficeRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Back office requisition not found' });
        }

        const item = await Item.findById(requisition.itemID);
        if (item) {
            item.quantity += requisition.quantity;
            await item.save();
        }

        await requisition.deleteOne();
        res.json({ message: 'Back office requisition deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
