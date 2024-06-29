const express = require('express');
const router = express.Router();
const HallAllocation = require('../banquetting/hallAllocation');
const Banquetting = require('../banquetting/banquetting');

router.post('/hallAllocations', async (req, res) => {
    try {
        const { banquttingId, hall_name } = req.body;

        const banquetting = await Banquetting.findById(banquttingId);
        if (!banquetting) {
            return res.status(404).json({ message: 'Banquetting record not found' });
        }

        const newHallAllocation = new HallAllocation({
            banquttingId,
            hall_name
        });

        await newHallAllocation.save();
        res.status(201).json(newHallAllocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/hallAllocations', async (req, res) => {
    try {
        const hallAllocations = await HallAllocation.find().populate('banquttingId');
        res.json(hallAllocations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/hallAllocations/:id', async (req, res) => {
    try {
        const hallAllocation = await HallAllocation.findById(req.params.id).populate('banquttingId');
        if (!hallAllocation) {
            return res.status(404).json({ message: 'Hall allocation not found' });
        }
        res.json(hallAllocation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/hallAllocations/:id', async (req, res) => {
    try {
        const { hall_name } = req.body;
        const hallAllocation = await HallAllocation.findById(req.params.id);
        if (!hallAllocation) {
            return res.status(404).json({ message: 'Hall allocation not found' });
        }

        if (hall_name) {
            hallAllocation.hall_name = hall_name;
        }

        const updatedHallAllocation = await hallAllocation.save();
        res.json(updatedHallAllocation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a hall allocation
router.delete('/hallAllocations/:id', async (req, res) => {
    try {
        const hallAllocation = await HallAllocation.findById(req.params.id);
        if (!hallAllocation) {
            return res.status(404).json({ message: 'Hall allocation not found' });
        }

        await hallAllocation.deleteOne();
        res.json({ message: 'Hall allocation deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
