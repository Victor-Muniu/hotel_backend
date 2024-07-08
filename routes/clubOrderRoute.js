const express = require('express');
const router = express.Router();
const ClubOrder = require('../sales/clubOrder');
const Menu = require('../models/menu');
const Staff = require('../models/staff');
const Table = require('../models/table');
const ClubBill = require('../sales/clubBills');
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

router.post('/clubOrders', async (req, res) => {
    try {
        const { items, staffName, table_no, remarks, date } = req.body;

        const staff = await Staff.findOne({ fname: staffName });
        if (!staff) {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        const table = await Table.findOne({ table_no });
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }

        table.status = 'Occupied';
        await table.save();

        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const menuItem = await Menu.findOne({ name: item.menuName });
            if (!menuItem) {
                return res.status(404).json({ message: `Menu item ${item.menuName} not found` });
            }

            const itemAmount = menuItem.price * item.quantity;
            totalAmount += itemAmount;

            orderItems.push({
                menuId: menuItem._id,
                quantity: item.quantity,
                amount: itemAmount
            });

            menuItem.quantity -= item.quantity;
            await menuItem.save();
        }

        const newOrder = new ClubOrder({
            items: orderItems,
            tableId: table._id,
            staffId: staff._id,
            totalAmount,
            remarks,
            date
        });

        await newOrder.save();

        const newBill = new ClubBill({
            clubOrderId: newOrder._id,
            staffName: staffName,
            amount: totalAmount,
            date: date,
            menuName: items.map(item => item.menuName).join(', '),
            status: 'Not cleared'
        });

        await newBill.save();

        const newSale = new Sales({
            restaurantOrderId: newBill._id,
            amount: totalAmount
        });

        await newSale.save();

        await updateFinancialEntries('Sales', totalAmount, new Date(), 'add');

        res.status(201).json(newOrder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/clubOrders', async (req, res) => {
    try {
        const orders = await ClubOrder.find()
            .populate('items.menuId', 'name')
            .populate('staffId', 'fname')
            .populate('tableId', 'table_no');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/clubOrders/:id', async (req, res) => {
    try {
        const order = await ClubOrder.findById(req.params.id)
            .populate('items.menuId', 'name')
            .populate('staffId', 'fname')
            .populate('tableId', 'table_no');
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
        const { items, staffName, table_no, remarks } = req.body;
        const order = await ClubOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const menuItem = await Menu.findOne({ name: item.menuName });
            if (!menuItem) {
                return res.status(404).json({ message: `Menu item ${item.menuName} not found` });
            }

            const itemAmount = menuItem.price * item.quantity;
            totalAmount += itemAmount;

            orderItems.push({
                menuId: menuItem._id,
                quantity: item.quantity,
                amount: itemAmount
            });
        }

        order.items = orderItems;
        order.totalAmount = totalAmount;

        if (staffName) {
            const staff = await Staff.findOne({ fname: staffName });
            if (!staff) {
                return res.status(404).json({ message: 'Staff member not found' });
            }
            order.staffId = staff._id;
        }

        if (table_no) {
            const table = await Table.findOne({ table_no });
            if (!table) {
                return res.status(404).json({ message: 'Table not found' });
            }
            order.tableId = table._id;

            table.status = 'Occupied';
            await table.save();
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

        for (const item of order.items) {
            const menuItem = await Menu.findById(item.menuId);
            if (menuItem) {
                menuItem.quantity += item.quantity;
                await menuItem.save();
            }
        }

        const table = await Table.findById(order.tableId);
        if (table) {
            table.status = 'Available';
            await table.save();
        }

        await order.deleteOne();

        await updateFinancialEntries('Sales', order.totalAmount, new Date(), 'subtract');

        res.json({ message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
