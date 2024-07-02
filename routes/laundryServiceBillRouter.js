const express = require('express');
const router = express.Router();
const LaundryServiceBill = require('../sales/laundryServiceBill');
const LaundryService = require('../reservations/laundry_service'); 
const Room = require('../house_keeping/rooms')

// POST a new laundry service bill
router.post('/laundry-service-bills', async (req, res) => {
    const { roomId, laundryServices } = req.body;

    try {
        // Fetch details of each laundry service from LaundryService model
        const fetchedLaundryServices = await Promise.all(laundryServices.map(async service => {
            const laundryService = await LaundryService.findById(service.laundryID);
            if (!laundryService) {
                throw new Error(`LaundryService with ID ${service.laundryID} not found`);
            }
            return {
                _id: service._id,
                laundryID: service.laundryID,
                quantity: service.quantity,
                name: laundryService.name,
                pricePerUnit: laundryService.pricePerUnit
            };
        }));

        // Fetch details of the room from Room model
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error(`Room with ID ${roomId} not found`);
        }

        // Calculate total amount for the bill
        let total = 0;
        fetchedLaundryServices.forEach(service => {
            total += service.quantity * service.pricePerUnit;
        });

        // Create new LaundryServiceBill object and save to database
        const newBill = new LaundryServiceBill({
            roomId,
            roomNumber: room.roomNumber,
            laundryServices: fetchedLaundryServices,
            total
        });

        await newBill.save();

        res.status(201).json(newBill);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// GET all laundry service bills with populated details
router.get('/laundry-service-bills', async (req, res) => {
    try {
        const bills = await LaundryServiceBill.find()
            .populate({
                path: 'roomId',
                model: 'Room'
            })
            .populate({
                path: 'laundryServices.laundryID',
                model: 'LaundryService'
            })
            .exec();

        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET a specific laundry service bill by ID
router.get('/laundry-service-bills/:id', async (req, res) => {
    try {
        const bill = await LaundryServiceBill.findById(req.params.id)
            .populate({
                path: 'roomId',
                model: 'Room'
            })
            .populate({
                path: 'laundryServices.laundryID',
                model: 'LaundryService'
            })
            .exec();

        if (!bill) {
            return res.status(404).json({ message: 'LaundryServiceBill not found' });
        }

        res.json(bill);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// DELETE a specific laundry service bill by ID
router.delete('/laundry-service-bills/:id', async (req, res) => {
    try {
        const deletedBill = await LaundryServiceBill.findByIdAndDelete(req.params.id);
        if (!deletedBill) {
            return res.status(404).json({ message: 'LaundryServiceBill not found' });
        }
        res.json({ message: 'LaundryServiceBill deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;