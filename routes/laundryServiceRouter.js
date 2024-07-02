const express = require('express');
const router = express.Router();
const LaundryService = require('../reservations/laundry_service');

router.post('/laundry-services', async (req, res) => {
    try {
        const { name, price } = req.body;

        const newLaundryService = new LaundryService({
            name,
            price
        });

        await newLaundryService.save();
        res.status(201).json(newLaundryService);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/laundry-services', async (req, res) => {
    try {
        const laundryServices = await LaundryService.find();
        res.json(laundryServices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/laundry-services/:id', async (req, res) => {
    try {
        const laundryService = await LaundryService.findById(req.params.id);
        if (!laundryService) {
            return res.status(404).json({ message: 'Laundry service not found' });
        }
        res.json(laundryService);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/laundry-services/:id', async (req, res) => {
    try {
        const updatedData = req.body;

        const updatedLaundryService = await LaundryService.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!updatedLaundryService) {
            return res.status(404).json({ message: 'Laundry service not found' });
        }
        res.json(updatedLaundryService);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.delete('/laundry-services/:id', async (req, res) => {
    try {
        const deletedLaundryService = await LaundryService.findByIdAndDelete(req.params.id);
        if (!deletedLaundryService) {
            return res.status(404).json({ message: 'Laundry service not found' });
        }
        res.json({ message: 'Laundry service deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
