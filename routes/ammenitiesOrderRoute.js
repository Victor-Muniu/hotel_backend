const express = require('express');
const router = express.Router();
const AmmenitiesOrder = require('../sales/ammenitiesOrder');
const Ammenities = require('../ammenities/ammenities');
const Staff = require('../models/staff');
const TrialBalance = require('../accounts/trial_balance');
const Sales = require('../accounts/sales');
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

router.post('/ammenitiesOrders', async (req, res) => {
    try {
        const { ammenitiesName, staffName, age_group, quantity, date } = req.body;

        const ammenity = await Ammenities.findOne({ name: ammenitiesName, age_group });
        if (!ammenity) {
            return res.status(404).json({ message: 'Ammenity not found' });
        }

        const staff = await Staff.findOne({ fname: staffName });
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        const amount = ammenity.price * quantity;

        const newOrder = new AmmenitiesOrder({
            ammenitiesId: ammenity._id,
            age_group,
            quantity,
            amount,
            staffId: staff._id,
            date
        });

        await newOrder.save();

        const newSale = new Sales({
            ammenitiesId: newOrder._id,
            amount
        });

        await newSale.save();

        await updateFinancialEntries('Sales', amount, new Date(date), 'add');

        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/ammenitiesOrders', async (req, res) => {
    try {
        const orders = await AmmenitiesOrder.find().populate('ammenitiesId').populate('staffId');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/ammenitiesOrders/:id', async (req, res) => {
    try {
        const order = await AmmenitiesOrder.findById(req.params.id).populate('ammenitiesId').populate('staffId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/ammenitiesOrders/:id', async (req, res) => {
    try {
        const { ammenitiesName, staffName, age_group, quantity, date } = req.body;
        const order = await AmmenitiesOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (ammenitiesName && age_group) {
            const ammenity = await Ammenities.findOne({ name: ammenitiesName, age_group });
            if (!ammenity) {
                return res.status(404).json({ message: 'Ammenity not found' });
            }
            order.ammenitiesId = ammenity._id;
            order.amount = ammenity.price * quantity;
        }

        if (staffName) {
            const staff = await Staff.findOne({ fname: staffName });
            if (!staff) {
                return res.status(404).json({ message: 'Staff member not found' });
            }
            order.staffId = staff._id;
        }

        if (quantity) {
            const ammenity = await Ammenities.findById(order.ammenitiesId);
            order.quantity = quantity;
            order.amount = ammenity.price * quantity;
        }

        if (age_group) {
            order.age_group = age_group;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/ammenitiesOrders/:id', async (req, res) => {
    try {
        const order = await AmmenitiesOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await updateFinancialEntries('Sales', order.amount, new Date(order.date), 'subtract');

        await order.deleteOne();
        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;