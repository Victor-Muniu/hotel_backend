const express = require('express');
const router = express.Router();
const ClubOrder = require('../sales/clubOrder');
const Menu = require('../models/menu');
const Staff = require('../models/staff');
const Table = require('../models/table');
const TrialBalance = require('../accounts/trial_balance');
const ClubBill = require('../sales/clubBills');
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

router.post('/clubOrders', async (req, res) => {
    try {
        const { menuName, staffName, quantity, table_no, remarks, date } = req.body;

        const menuItem = await Menu.findOne({ name: menuName });
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const staff = await Staff.findOne({ fname: staffName });
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        const table = await Table.findOne({ table_no });
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }

        const amount = menuItem.price * quantity;

        const newOrder = new ClubOrder({
            menuId: menuItem._id,
            quantity,
            tableId: table._id,
            staffId: staff._id,
            amount,
            remarks,
            date
        });

        await newOrder.save();

        const newBill = new ClubBill({
            clubOrderId: newOrder._id,
            staffName,
            amount,
            date,
            menuName,
            status: 'Not cleared'
        });

        await newBill.save();

        const newSale = new Sales({
            restaurantOrderId: newBill._id,
            amount
        });

        await newSale.save();

        await updateFinancialEntries('Sales', amount, new Date(), 'add');

        res.status(201).json({ newOrder, newBill });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/clubOrders', async (req, res) => {
    try {
        const orders = await ClubOrder.find().populate('menuId').populate('staffId').populate('tableId');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/clubOrders/:id', async (req, res) => {
    try {
        const order = await ClubOrder.findById(req.params.id).populate('menuId').populate('staffId').populate('tableId');
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/clubOrders/:id', async (req, res) => {
    try {
        const { menuName, staffName, quantity, table_no, remarks } = req.body;
        const order = await ClubOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (menuName) {
            const menuItem = await Menu.findOne({ name: menuName });
            if (!menuItem) {
                return res.status(404).json({ message: 'Menu item not found' });
            }
            order.menuId = menuItem._id;
            order.amount = menuItem.price * quantity;
        }

        if (staffName) {
            const staff = await Staff.findOne({ fname: staffName });
            if (!staff) {
                return res.status(404).json({ message: 'Staff member not found' });
            }
            order.staffId = staff._id;
        }

        if (quantity) {
            const menuItem = await Menu.findById(order.menuId);
            if (menuItem.quantity + order.quantity < quantity) {
                return res.status(400).json({ message: 'Insufficient quantity available' });
            }
            menuItem.quantity += order.quantity - quantity;
            await menuItem.save();

            order.quantity = quantity;
            order.amount = menuItem.price * quantity;
        }

        if (table_no) {
            const table = await Table.findOne({ table_no });
            if (!table) {
                return res.status(404).json({ message: 'Table not found' });
            }
            order.tableId = table._id;
        }

        if (remarks) {
            order.remarks = remarks;
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/clubOrders/:id', async (req, res) => {
    try {
        const order = await ClubOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const menuItem = await Menu.findById(order.menuId);
        if (menuItem) {
            menuItem.quantity += order.quantity;
            await menuItem.save();
        }

        await updateFinancialEntries('Sales', order.amount, new Date(), 'subtract');

        await order.deleteOne();
        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
