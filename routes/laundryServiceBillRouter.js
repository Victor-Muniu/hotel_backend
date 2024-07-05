const express = require('express');
const router = express.Router();
const LaundryServiceBill = require('../sales/laundryServiceBill');
const LaundryService = require('../reservations/laundry_service');
const Room = require('../house_keeping/rooms');


router.get('/laundry-service-bills/room/:room_no', async (req, res) => {
    const { room_no } = req.params;

    try {
        // Find the room by room_no
        const room = await Room.findOne({ room_no });
        if (!room) {
            return res.status(404).json({ message: `Room with room number ${room_no} not found` });
        }

        // Find the laundry service bills by roomId
        const bills = await LaundryServiceBill.find({ roomId: room._id })
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




router.post('/laundry-service-bills', async (req, res) => {
    const { roomId, laundryServices } = req.body;

    try {
        
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

        
        const room = await Room.findById(roomId);
        if (!room) {
            throw new Error(`Room with ID ${roomId} not found`);
        }

        let total = 0;
        fetchedLaundryServices.forEach(service => {
            total += service.quantity * service.pricePerUnit;
        });

        
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
