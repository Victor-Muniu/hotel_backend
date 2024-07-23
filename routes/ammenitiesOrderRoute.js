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
        const { ammenities, staffName, date } = req.body;

        const staff = await Staff.findOne({ fname: staffName.split(' ')[0], lname: staffName.split(' ')[1] });
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        let totalAmount = 0;
        let orders = [];

        for (const ammenity of ammenities) {
            for (let i = 0; i < ammenity.ammenitiesName.length; i++) {
                const foundAmmenity = await Ammenities.findOne({ name: ammenity.ammenitiesName[i], age_group: ammenity.age_group[i] });
                if (!foundAmmenity) {
                    return res.status(404).json({ message: `Ammenity ${ammenity.ammenitiesName[i]} not found for age group ${ammenity.age_group[i]}` });
                }

                const amount = foundAmmenity.price * ammenity.quantity[i];
                totalAmount += amount;

                const newOrder = new AmmenitiesOrder({
                    ammenitiesId: foundAmmenity._id,
                    age_group: ammenity.age_group,
                    quantity: ammenity.quantity,
                    amount,
                    staffId: staff._id,
                    date
                });

                await newOrder.save();
                orders.push(newOrder);

                const newSale = new Sales({
                    curioId: newOrder._id,
                    amount
                });

                await newSale.save();
            }
        }

        await updateFinancialEntries('Sales', totalAmount, new Date(date), 'add');

        res.status(201).json(orders);
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
        const { ammenities, staffName, date } = req.body;
        const order = await AmmenitiesOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let totalAmount = 0;

        if (ammenities) {
            for (const ammenity of ammenities) {
                for (let i = 0; i < ammenity.ammenitiesName.length; i++) {
                    const foundAmmenity = await Ammenities.findOne({ name: ammenity.ammenitiesName[i], age_group: ammenity.age_group[i] });
                    if (!foundAmmenity) {
                        return res.status(404).json({ message: `Ammenity ${ammenity.ammenitiesName[i]} not found for age group ${ammenity.age_group[i]}` });
                    }
                    order.ammenitiesId = foundAmmenity._id;
                    order.age_group = ammenity.age_group;
                    order.quantity = ammenity.quantity;
                    order.amount = foundAmmenity.price * ammenity.quantity[i];
                    totalAmount += order.amount;
                }
            }
        }

        if (staffName) {
            const staff = await Staff.findOne({ fname: staffName.split(' ')[0], lname: staffName.split(' ')[1] });
            if (!staff) {
                return res.status(404).json({ message: 'Staff member not found' });
            }
            order.staffId = staff._id;
        }

        if (date) {
            order.date = new Date(date);
        }

        const updatedOrder = await order.save();
        await updateFinancialEntries('Sales', totalAmount, new Date(date), 'add');

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
