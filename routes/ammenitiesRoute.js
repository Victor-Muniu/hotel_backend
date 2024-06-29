const express = require('express');
const router = express.Router();
const Ammenities = require('../ammenities/ammenities');

router.post('/ammenities', async (req, res) => {
    try {
        const { name, price, age_group } = req.body;

        const newAmmenity = new Ammenities({
            name,
            price,
            age_group
        });

        await newAmmenity.save();
        res.status(201).json(newAmmenity);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/ammenities', async (req, res) => {
    try {
        const ammenities = await Ammenities.find();
        res.json(ammenities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/ammenities/:id', async (req, res) => {
    try {
        const ammenity = await Ammenities.findById(req.params.id);
        if (!ammenity) {
            return res.status(404).json({ message: 'Ammenity not found' });
        }
        res.json(ammenity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/ammenities/:id', async (req, res) => {
    try {
        const { name, price, age_group } = req.body;
        const ammenity = await Ammenities.findById(req.params.id);
        if (!ammenity) {
            return res.status(404).json({ message: 'Ammenity not found' });
        }

        if (name) ammenity.name = name;
        if (price) ammenity.price = price;
        if (age_group) ammenity.age_group = age_group;

        const updatedAmmenity = await ammenity.save();
        res.json(updatedAmmenity);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/ammenities/:id', async (req, res) => {
    try {
        const ammenity = await Ammenities.findById(req.params.id);
        if (!ammenity) {
            return res.status(404).json({ message: 'Ammenity not found' });
        }

        await ammenity.deleteOne();
        res.json({ message: 'Ammenity deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
