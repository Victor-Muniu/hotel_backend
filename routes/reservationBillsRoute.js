const express = require('express');
const router = express.Router();
const ReservationBills = require('../sales/reservationsBills');
const Reservation = require('../reservations/reservation');


router.post('/reservation-bills', async (req, res) => {
    const { reservationID, total } = req.body;
    try {
        const newBill = new ReservationBills({ reservationID, total });
        await newBill.save();
        res.status(201).json(newBill);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/reservation-bills', async (req, res) => {
    try {
        const bills = await ReservationBills.find().populate('reservationID');
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/reservation-bills/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const bill = await ReservationBills.findById(id).populate('reservationID');
        if (!bill) {
            return res.status(404).json({ message: 'Reservation bill not found' });
        }
        res.json(bill);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.delete('/reservation-bills/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBill = await ReservationBills.findByIdAndDelete(id);
        if (!deletedBill) {
            return res.status(404).json({ message: 'Reservation bill not found' });
        }
        res.json({ message: 'Reservation bill deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
