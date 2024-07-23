const express = require('express');
const router = express.Router();
const CurioPOS = require('../reservations/curio_pos');
const Drinks = require('../transfer/drinks');
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

router.post('/curioPOS', async (req, res) => {
    try {
        const { drinksNames, staffName, quantity, price, date } = req.body;
        const [fname, lname] = staffName.split(' ');

        const staff = await Staff.findOne({ fname, lname });
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        let drinkIds = [];
        let totalAmount = 0;

        for (let i = 0; i < drinksNames.length; i++) {
            const drink = await Drinks.findOne({ name: drinksNames[i] });
            if (!drink) {
                return res.status(404).json({ message: `Drink ${drinksNames[i]} not found` });
            }
            
            if (drink.availableQuantity < quantity[i]) {
                return res.status(400).json({ message: `Insufficient quantity for ${drinksNames[i]}` });
            }
            
            drinkIds.push(drink._id);
            totalAmount += price[i] * quantity[i];
        }

        const newCurioPOS = new CurioPOS({
            curioId: drinkIds,
            staffId: staff._id,
            quantity,
            price,
            date,
            total_amount: totalAmount
        });

        await newCurioPOS.save();

        const newSale = new Sales({
            curioId: newCurioPOS._id,
            amount: totalAmount
        });

        await newSale.save();
        await updateFinancialEntries('Sales', totalAmount, new Date(date), 'add');


        for (let i = 0; i < drinksNames.length; i++) {
            const drink = await Drinks.findOne({ name: drinksNames[i] });
            drink.quantity -= quantity[i];
            await drink.save();
        }

        res.status(201).json(newCurioPOS);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/curioPOS', async (req, res) => {
    try {
        const orders = await CurioPOS.find().populate('curioId').populate('staffId');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/curioPOS/:id', async (req, res) => {
    try {
        const order = await CurioPOS.findById(req.params.id).populate('curioId').populate('staffId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/curioPOS/:id', async (req, res) => {
    try {
        const { drinksNames, staffName, quantity, price, date } = req.body;
        const order = await CurioPOS.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let totalAmount = 0;

        if (drinksNames) {
            let drinkIds = [];
            for (let i = 0; i < drinksNames.length; i++) {
                const drink = await Drinks.findOne({ name: drinksNames[i] });
                if (!drink) {
                    return res.status(404).json({ message: `Drink ${drinksNames[i]} not found` });
                }
                drinkIds.push(drink._id);
                totalAmount += price[i] * quantity[i];
            }
            order.curioId = drinkIds;
            order.quantity = quantity;
            order.price = price;
            order.total_amount = totalAmount;
        }

        if (staffName) {
            const [fname, lname] = staffName.split(' ');
            const staff = await Staff.findOne({ fname, lname });
            if (!staff) {
                return res.status(404).json({ message: 'Staff member not found' });
            }
            order.staffId = staff._id;
        }

        if (date) {
            order.date = new Date(date);
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/curioPOS/:id', async (req, res) => {
    try {
        const order = await CurioPOS.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        await order.deleteOne();
        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
