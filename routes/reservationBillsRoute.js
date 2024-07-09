const express = require('express');
const router = express.Router();
const ReservationBills = require('../sales/reservationsBills');
const Reservation = require('../reservations/reservation');
const TrialBalance = require('../accounts/trial_balance');
const ProfitLoss = require('../accounts/profit&loss');

async function updateFinancialEntries(groupName, amount, date, action = 'add') {
    const year = date.getFullYear();

    let trialBalanceEntry = await TrialBalance.findOne({
        group_name: groupName,
        Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    });
    let profitLossEntry = await ProfitLoss.findOne({
        group_name: groupName,
        Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    });

    if (!trialBalanceEntry) {
        trialBalanceEntry = new TrialBalance({
            group_name: groupName,
            Debit: 0,
            Credit: action === 'add' ? amount : 0,
            Date: new Date(year, 0, 1)
        });
    } else {
        trialBalanceEntry.Credit = action === 'add' ? trialBalanceEntry.Credit + amount : trialBalanceEntry.Credit - amount;
    }

    if (!profitLossEntry) {
        profitLossEntry = new ProfitLoss({
            group_name: groupName,
            Debit: 0,
            Credit: action === 'add' ? amount : 0,
            Date: new Date(year, 0, 1)
        });
    } else {
        profitLossEntry.Credit = action === 'add' ? profitLossEntry.Credit + amount : profitLossEntry.Credit - amount;
    }

    await trialBalanceEntry.save();
    await profitLossEntry.save();
}


router.post('/reservation-bills', async (req, res) => {
    const { reservationID, total_amount,  package_price } = req.body;
    try {
        const reservation = await Reservation.findById(reservationID);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        const total_amount = package_price.reduce((acc, price) => acc + price, 0)

        const newBill = new ReservationBills({ reservationID,package_price, total_amount });
        await newBill.save();

        const newSale = new Sales({
            ammenitiesId: newRoomService._id,
            amount: total_amount
        });

        await newSale.save();

       
        await updateFinancialEntries('Sales', total_amount, new Date(), 'add')
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

router.get('/reservation-bills/room/:room_no', async (req, res) => {
    const { room_no } = req.params;
    try {
        const reservations = await Reservation.find({ room_no: room_no });
        if (!reservations || reservations.length === 0) {
            return res.status(404).json({ message: 'No reservations found for this room number' });
        }

        const reservationIDs = reservations.map(reservation => reservation._id);
        const bills = await ReservationBills.find({ reservationID: { $in: reservationIDs } }).populate('reservationID');
        
        if (!bills || bills.length === 0) {
            return res.status(404).json({ message: 'No reservation bills found for this room number' });
        }

        res.json(bills);
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
