const express = require('express');
const router = express.Router();
const Individual = require('../reservations/individual');
const Room = require('../house_keeping/rooms');

router.post('/individuals', async (req, res) => {
    try {
        const { room_no } = req.body;

        const room = await Room.findOne({ room_no });
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.vacancy === 'Occupied') {
            return res.status(400).json({ message: 'Room is already occupied' });
        }

        const newReservation = new Individual(req.body);
        const savedReservation = await newReservation.save();

        await Room.updateOne({ room_no }, { vacancy: 'Occupied' });

        res.status(201).json(savedReservation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/individuals', async (req, res) => {
    try {
        const reservations = await Individual.find();
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/individuals/:id', async (req, res) => {
    try {
        const reservation = await Individual.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/individuals/room/:room_no', async (req, res) => {
    try {
        const { room_no } = req.params;
        const reservation = await Individual.findOne({ room_no }).sort({ checkin: -1 });
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/individuals/:id', async (req, res) => {
    try {
        const updatedReservation = await Individual.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedReservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        res.json(updatedReservation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/individuals/:id', async (req, res) => {
    try {
        const deletedReservation = await Individual.findByIdAndDelete(req.params.id);
        if (!deletedReservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        await Room.updateOne({ room_no: deletedReservation.room_no }, { vacancy: 'Vacant' });

        res.json({ message: 'Reservation deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
