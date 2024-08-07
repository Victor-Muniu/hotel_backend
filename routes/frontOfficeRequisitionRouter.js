const express = require('express');
const router = express.Router();
const FrontOfficeRequisition = require('../requisition/frontOfficeRequisition');
const Item = require('../store/item');
const MiniStore = require('../reservations/ministore');

router.post('/frontOfficeRequisitions', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;
        const item = await Item.findOne({ name: itemName });
        
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (item.quantity < quantity) {
            return res.status(400).json({ message: 'Insufficient quantity available' });
        }

        const newRequisition = new FrontOfficeRequisition({
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

router.patch('/frontOfficeRequisitions/:id', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;
        const requisition = await FrontOfficeRequisition.findById(req.params.id);

        if (!requisition) {
            return res.status(404).json({ message: 'Front office requisition not found' });
        }

        const item = await Item.findOne({ name: itemName });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (status === 'Approved') {
            if (item.quantity < quantity) {
                return res.status(400).json({ message: 'Insufficient quantity in Stock' });
            }

            let miniStoreItem = await MiniStore.findOne({ name: item.name });

            if (miniStoreItem) {
                miniStoreItem.quantity += quantity;
                miniStoreItem.value += item.unit_price * quantity;
            } else {
                miniStoreItem = new MiniStore({
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

            await miniStoreItem.save();
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

router.get('/frontOfficeRequisitions', async (req, res) => {
    try {
        const requisitions = await FrontOfficeRequisition.find().populate('itemID');
        const populatedRequisitions = requisitions.map(req => ({
            ...req.toObject(),
            itemName: req.itemID.name
        }));
        res.json(populatedRequisitions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/frontOfficeRequisitions/:id', async (req, res) => {
    try {
        const requisition = await FrontOfficeRequisition.findById(req.params.id).populate('itemID');
        if (!requisition) {
            return res.status(404).json({ message: 'Front office requisition not found' });
        }
        res.json({
            ...requisition.toObject(),
            itemName: requisition.itemID.name
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/frontOfficeRequisitions/:id', async (req, res) => {
    try {
        const requisition = await FrontOfficeRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Front office requisition not found' });
        }

        const item = await Item.findById(requisition.itemID);
        if (item) {
            item.quantity += requisition.quantity;
            await item.save();
        }

        await requisition.deleteOne();
        res.json({ message: 'Front office requisition deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
