const express = require('express');
const router = express.Router();
const RoomService = require('../reservations/room_service');
const Menu = require('../models/menu');
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




router.post('/room-services', async (req, res) => {
    try {
        const { menuItems, delivery_fee, room_no } = req.body;

        let totalPrice = 0;
        const menuIds = [];
        const quantities = []; // Array to store quantities

        for (const item of menuItems) {
            const menu = await Menu.findOne({ name: item.name });
            if (!menu) {
                return res.status(404).json({ message: `Menu item ${item.name} not found` });
            }
            menuIds.push(menu._id);
            quantities.push(item.quantity); // Push quantity to array
            totalPrice += menu.price * item.quantity;
        }

        totalPrice += delivery_fee || 500;

        const newRoomService = new RoomService({
            menuId: menuIds,
            delivery_fee: delivery_fee || 500,
            quantity: quantities, // Assign quantities array to quantity field
            total: totalPrice,
            room_no: room_no
        });

        await newRoomService.save();

        

        await updateFinancialEntries('Sales', totalPrice, new Date(), 'add');

        res.status(201).json(newRoomService);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/room-services', async (req, res) => {
    try {
        const roomServices = await RoomService.find().populate('menuId');
        res.json(roomServices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/room-services/:id', async (req, res) => {
    try {
        const roomService = await RoomService.findById(req.params.id).populate('menuId');
        if (!roomService) {
            return res.status(404).json({ message: 'Room service not found' });
        }
        res.json(roomService);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/room-services/:id', async (req, res) => {
    try {
        const { menuItems, delivery_fee , room_no} = req.body;

  
        let totalPrice = 0;
        const menuIds = [];
        for (const item of menuItems) {
            const menu = await Menu.findOne({ name: item.name });
            if (!menu) {
                return res.status(404).json({ message: `Menu item ${item.name} not found` });
            }
            menuIds.push(menu._id);
            totalPrice += menu.price * item.quantity;
        }

        totalPrice += delivery_fee || 500;  

        const updatedRoomService = await RoomService.findByIdAndUpdate(
            req.params.id,
            { menuId: menuIds, delivery_fee: delivery_fee || 500, total: totalPrice ,room_no },
            { new: true }
        );

        if (!updatedRoomService) {
            return res.status(404).json({ message: 'Room service not found' });
        }

        res.json(updatedRoomService);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/room-services/room/:room_no', async (req, res) => {
    try {
        const roomServices = await RoomService.find({ room_no: req.params.room_no }).populate('menuId');
        if (!roomServices || roomServices.length === 0) {
            return res.status(404).json({ message: 'Room services not found' });
        }
        res.json(roomServices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/room-services/:id', async (req, res) => {
    try {
        const deletedRoomService = await RoomService.findByIdAndDelete(req.params.id);
        if (!deletedRoomService) {
            return res.status(404).json({ message: 'Room service not found' });
        }
        res.json({ message: 'Room service deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
