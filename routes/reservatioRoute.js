const express = require('express');
const router = express.Router();
const Reservation = require('../reservations/reservation');
const Room = require('../house_keeping/rooms');
const CheckOut = require('../reservations/checkout')

router.post('/reservations', async (req, res) => {
    try {
        const { type, individual, group, checkOutdate, checkIndate,  adults, kids, room_no, package_type, group_name } = req.body;

        for (let room of room_no) {
            let roomEntry = await Room.findOne({ room_no: room });
            if (!roomEntry) {
                roomEntry = new Room({ room_no: room, vacancy: 'Occupied' });
            } else if (roomEntry.vacancy === 'Occupied') {
                return res.status(400).json({ message: `Room ${room} is already occupied.` });
            } else {
                roomEntry.vacancy = 'Occupied';
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
                    roomEntry.vacancy = 'Available';
                    await roomEntry.save();
                }
            }

            for (let room of updatedData.room_no) {
                let roomEntry = await Room.findOne({ room_no: room });
                if (!roomEntry) {
                    roomEntry = new Room({ room_no: room, vacancy: 'Occupied' });
                } else if (roomEntry.vacancy === 'Occupied') {
                    return res.status(400).json({ message: `Room ${room} is already occupied.` });
                } else {
                    roomEntry.vacancy = 'Occupied';
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
        const checkOutDetails = new CheckOut({
            fname: reservation.individual ? reservation.individual.fname : '',
            lname: reservation.individual ? reservation.individual.lname : '',
            national_id: reservation.individual ? reservation.individual.national_id : '',
            contact: reservation.individual ? reservation.individual.contact : '',
            email: reservation.individual ? reservation.individual.email : ''
        });

        
        await checkOutDetails.save();

        for (let room of reservation.room_no) {
            let roomEntry = await Room.findOne({ room_no: room });
            if (roomEntry) {
                roomEntry.vacancy = 'Available';
                roomEntry.clean = 'No';
                await roomEntry.save();
            }
        }

        await Reservation.findByIdAndDelete(req.params.id);

        res.json({ message: 'Reservation deleted and checked out details saved' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
