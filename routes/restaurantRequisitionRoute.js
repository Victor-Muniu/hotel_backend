const express = require('express');
const router = express.Router();
const RestaurantRequisition = require('../requisition/restaurantRequisition');
const Item = require('../store/item');

router.post('/restaurantRequisitions', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const newRequisition = new RestaurantRequisition({
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

router.patch('/restaurantRequisitions/:id', async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const updatedRequisition = await RestaurantRequisition.findByIdAndUpdate(req.params.id, {
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

router.get('/restaurantRequisitions', async (req, res) => {
    try {
        const requisitions = await RestaurantRequisition.find().populate('itemID', 'name');
        res.json(requisitions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.delete('/restaurantRequisitions/:id', async (req, res) => {
    try {
        const requisition = await RestaurantRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }
        await requisition.deleteOne();
        res.json({ message: 'Requisition deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;