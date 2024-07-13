const express = require('express');
const router = express.Router();
const Item = require('../store/item');
const Transfer = require('../transfer/drinks');
const StockMovement = require('../store/stockTracker');

router.post('/items', async (req, res) => {
    try {
        const { name, description, group, unit_price, quantity, spoilt, date } = req.body;
        let newItem = new Item(req.body);
        newItem.value = newItem.quantity * newItem.unit_price;

        const transferGroups = ["Curio", "Banquetting", "Bar", "Restaurant", "House Keeping", "Internal"];

        if (transferGroups.includes(newItem.group)) {
            const existingItem = await Transfer.findOne({ name: newItem.name });

            if (existingItem) {
                existingItem.description = newItem.description;
                existingItem.unit_price = newItem.unit_price;
                existingItem.quantity += newItem.quantity;
                existingItem.spoilt += newItem.spoilt;
                existingItem.value = existingItem.quantity * existingItem.unit_price;
                existingItem.date = newItem.date;
                await existingItem.save();

                res.status(201).json(existingItem);
            } else {
                const newTransferItem = new Transfer({
                    name: newItem.name,
                    description: newItem.description,
                    group: newItem.group,
                    unit_price: newItem.unit_price,
                    quantity: newItem.quantity,
                    spoilt: newItem.spoilt,
                    value: newItem.value,
                    date: newItem.date
                });
                await newTransferItem.save();

                res.status(201).json(newTransferItem);
            }
        } else {
            const existingItem = await Item.findOne({ name: newItem.name });

            if (existingItem) {
                existingItem.description = description;
                existingItem.unit_price = unit_price;
                existingItem.quantity += quantity;
                existingItem.spoilt += spoilt;
                existingItem.value = existingItem.quantity * existingItem.unit_price;
                existingItem.date = date;
                await existingItem.save();

                const stockMovement = new StockMovement({
                    itemId: existingItem._id,
                    quantity,
                    movementType: 'purchase',
                    date
                });
                await stockMovement.save();

                res.status(201).json(existingItem);
            } else {
                await newItem.save();

                const stockMovement = new StockMovement({
                    itemId: newItem._id,
                    quantity: newItem.quantity,
                    movementType: 'purchase',
                    date: newItem.date
                });
                await stockMovement.save();

                res.status(201).json(newItem);
            }
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/items', async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/items/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/items/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const newQuantity = req.body.quantity !== undefined ? req.body.quantity : item.quantity;
        const quantityChange = newQuantity - item.quantity;

        if (req.body.name !== undefined) item.name = req.body.name;
        if (req.body.description !== undefined) item.description = req.body.description;
        if (req.body.unit_price !== undefined) item.unit_price = req.body.unit_price;
        if (req.body.group !== undefined) item.group = req.body.group;
        if (req.body.quantity !== undefined) item.quantity = req.body.quantity;
        if (req.body.spoilt !== undefined) item.spoilt = req.body.spoilt;
        if (req.body.date !== undefined) item.date = req.body.date;

        item.value = item.quantity * item.unit_price;

        const updatedItem = await item.save();

        const movementType = quantityChange > 0 ? 'purchase' : 'sale';
        const stockMovement = new StockMovement({
            itemId: item._id,
            quantity: Math.abs(quantityChange),
            movementType,
            date: new Date()
        });
        await stockMovement.save();

        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/items/:id', async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        await item.deleteOne();
        res.json({ message: 'Item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
