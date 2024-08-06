const express = require('express');
const router = express.Router();
const Receipe = require('../food_production/receip');

router.post('/receipes', async (req, res) => {
    try {
        const { name, raw_materials, quantity, unit_price } = req.body;

        if (quantity.length !== unit_price.length) {
            return res.status(400).json({ message: 'Quantity and unit_price arrays must have the same length' });
        }

        const total = unit_price.reduce((sum, price) => sum + price, 0);

        const newReceipe = new Receipe({
            name,
            raw_materials,
            quantity,
            unit_price,
            total
        });

        await newReceipe.save();
        res.status(201).json(newReceipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/receipes', async (req, res) => {
    try {
        const receipes = await Receipe.find();
        res.json(receipes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/receipes/:id', async (req, res) => {
    try {
        const receipe = await Receipe.findById(req.params.id);
        if (!receipe) {
            return res.status(404).json({ message: 'Receipe not found' });
        }
        res.json(receipe);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/receipes/:id', async (req, res) => {
    try {
        const { name, raw_materials, quantity, unit_price } = req.body;

        if (quantity && unit_price && quantity.length !== unit_price.length) {
            return res.status(400).json({ message: 'Quantity and unit_price arrays must have the same length' });
        }

        const updatedData = {};

        if (name) updatedData.name = name;
        if (raw_materials) updatedData.raw_materials = raw_materials;
        if (quantity) updatedData.quantity = quantity;
        if (unit_price) {
            updatedData.unit_price = unit_price;
            updatedData.total = unit_price.reduce((sum, price) => sum + price, 0);
        }

        const updatedReceipe = await Receipe.findByIdAndUpdate(req.params.id, updatedData, { new: true });

        if (!updatedReceipe) {
            return res.status(404).json({ message: 'Receipe not found' });
        }

        res.json(updatedReceipe);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.delete('/receipes/:id', async (req, res) => {
    try {
        const receipe = await Receipe.findByIdAndDelete(req.params.id);
        if (!receipe) {
            return res.status(404).json({ message: 'Receipe not found' });
        }
        res.json({ message: 'Receipe deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
