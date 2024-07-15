const express = require('express');
const router = express.Router();
const LaundryServiceBill = require('../sales/laundryServiceBill');
const LaundryService = require('../reservations/laundry_service');
const Room = require('../house_keeping/rooms');
const TrialBalance = require('../accounts/trial_balance');
const ProfitLoss = require('../accounts/profit&loss');
const Sales = require('../accounts/sales')
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

router.get('/laundry-service-bills/room/:room_no', async (req, res) => {
    const { room_no } = req.params;

    try {
        const room = await Room.findOne({ room_no });
        if (!room) {
            return res.status(404).json({ message: `Room with room number ${room_no} not found` });
        }

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
    const { room_no, laundryServices } = req.body;

    try {
        const room = await Room.findOne({ room_no });
        if (!room) {
            return res.status(404).json({ message: `Room with room number ${room_no} not found` });
        }

        const fetchedLaundryServices = await Promise.all(laundryServices.map(async service => {
            const laundryService = await LaundryService.findOne({ name: service.laundryName });
            if (!laundryService) {
                throw new Error(`LaundryService with name ${service.laundryName} not found`);
            }
            return {
                laundryID: laundryService._id,
                quantity: service.quantity,
                name: laundryService.name,
                pricePerUnit: laundryService.price
            };
        }));

        let total = 0;
        fetchedLaundryServices.forEach(service => {
            if (typeof service.pricePerUnit !== 'number' || typeof service.quantity !== 'number') {
                throw new Error(`Invalid price or quantity for laundry service ${service.name}`);
            }
            total += service.quantity * service.pricePerUnit;
        });

        const newBill = new LaundryServiceBill({
            roomId: room._id,
            laundryServices: fetchedLaundryServices.map(service => ({
                laundryID: service.laundryID,
                quantity: service.quantity
            })),
            total
        });
        await newBill.save();

        const salesEntry = new Sales({
            laundryServiceId: newBill._id,
            amount: total
        });
        await salesEntry.save();

   
        await updateFinancialEntries('Sales', total, new Date(), 'add');

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
