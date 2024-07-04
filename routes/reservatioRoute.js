const express = require('express');
const router = express.Router();
const Reservation = require('../reservations/reservation');
const Room = require('../house_keeping/rooms');

router.post('/reservations', async (req, res) => {
    try {
        const { type, individual, group, checkOutdate, checkIndate,  adults, kids, room_no, package_type, group_name } = req.body;

        for (let room of room_no) {
            let roomEntry = await Room.findOne({ room_no: room });
            if (!roomEntry) {
                roomEntry = new Room({ room_no: room, status: 'Occupied' });
            } else if (roomEntry.status === 'Occupied') {
                return res.status(400).json({ message: `Room ${room} is already occupied.` });
            } else {
                roomEntry.status = 'Occupied';
            }
            await roomEntry.save();
        }

        const newReservation = new Reservation({
            type,
            individual: type === 'individual' ? individual : undefined,
            group: type === 'group' ? group : undefined,
            group_name,
            adults,
            kids,
            room_no,
            package_type,
            checkOutdate,
            checkIndate
        });

        await newReservation.save();
        res.status(201).json(newReservation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



router.get('/reservations', async (req, res) => {
    try {
        const reservations = await Reservation.find();
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/reservations/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/reservations/:id', async (req, res) => {
    try {
        const updatedData = req.body;

        if (updatedData.room_no) {
            const reservation = await Reservation.findById(req.params.id);
            if (!reservation) {
                return res.status(404).json({ message: 'Reservation not found' });
            }

            for (let room of reservation.room_no) {
                let roomEntry = await Room.findOne({ room_no: room });
                if (roomEntry) {
                    roomEntry.status = 'Available';
                    await roomEntry.save();
                }
            }

            for (let room of updatedData.room_no) {
                let roomEntry = await Room.findOne({ room_no: room });
                if (!roomEntry) {
                    roomEntry = new Room({ room_no: room, status: 'Occupied' });
                } else if (roomEntry.status === 'Occupied') {
                    return res.status(400).json({ message: `Room ${room} is already occupied.` });
                } else {
                    roomEntry.status = 'Occupied';
                }
                await roomEntry.save();
            }
        }

        const updatedReservation = await Reservation.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!updatedReservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        res.json(updatedReservation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/reservations/:id', async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Update rooms to 'Available'
        for (let room of reservation.room_no) {
            let roomEntry = await Room.findOne({ room_no: room });
            if (roomEntry) {
                roomEntry.status = 'Available';
                await roomEntry.save();
            }
        }

        await Reservation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Reservation deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
