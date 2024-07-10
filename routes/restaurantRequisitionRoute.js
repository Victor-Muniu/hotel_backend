const express = require('express');
const router = express.Router();
const RestaurantRequisition = require('../requisition/restaurantRequisition');
const Item = require('../store/item');
const Alcarte = require('../restaurant/alcarte');

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

        if (status === 'Approved') {
            if (item.quantity < quantity) {
                return res.status(400).json({ message: 'Insufficient quantity in stock' });
            }

            // Check if Alcarte entry exists
            let alcarte = await Alcarte.findOne({ name: item.name });

            if (alcarte) {
                // Update existing Alcarte entry
                alcarte.quantity += quantity;
                alcarte.value += item.unit_price * quantity;
            } else {
                // Create new Alcarte entry
                alcarte = new Alcarte({
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

            await alcarte.save();

            item.quantity -= quantity;
            await item.save();
        }

        const updatedRequisition = await RestaurantRequisition.findByIdAndUpdate(
            req.params.id,
            {
                itemID: item._id,
                quantity,
                unit,
                description,
                date,
                department,
                status
            },
            { new: true }
        );

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
