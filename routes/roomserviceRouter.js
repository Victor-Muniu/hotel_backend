const express = require('express');
const router = express.Router();
const RoomService = require('../reservations/room_service');
const Menu = require('../models/menu');
const TrialBalance = require('../accounts/trial_balance');
const ProfitLoss = require('../accounts/profit&loss');
const Sales = require('../accounts/sales')

const Staff = require('../models/staff')
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next){
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({message: 'Unauthorized: Missing token'});
    }
    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        req.userId = decoded.user.emp_no;
        console.log('User ID:' , req.userId);
        next();
    }catch (err){
        res.clearCookie('token', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
        });
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
        
    }
}

async function isAdmin(req, res, next){
    try{
        const user = await Staff.findOne({emp_no: req.userId});
        console.log('User', user);
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'service' && user.role !== 'front office' )){
            console.log('User is not admin');
            return res.status(403).json({message: "Unauthorized: Only admin users can perform this action"});
            
        }
        console.log('User is Admin')
    } catch (err){
        res.status(500).json({message: err.message});
    }
} 


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

router.post('/room-services', verifyToken, isAdmin,  async (req, res) => {
    try {
        const { menuItems, delivery_fee, room_no } = req.body;

        let totalPrice = 0;
        const menuIds = [];
        const quantities = []; 

        for (const item of menuItems) {
            const menu = await Menu.findOne({ name: item.name });
            if (!menu) {
                return res.status(404).json({ message: `Menu item ${item.name} not found` });
            }
            menuIds.push(menu._id);
            quantities.push(item.quantity); 
            
            totalPrice += menu.price * item.quantity;
        }

        totalPrice += delivery_fee || 500;

        const newRoomService = new RoomService({
            menuId: menuIds,
            delivery_fee: delivery_fee || 500,
            quantity: quantities, 
            total: totalPrice,
            room_no: room_no
        });

        await newRoomService.save();

        const salesEntry = new Sales({
            roomServiceId: newRoomService._id,
            amount: totalPrice
        });
        await salesEntry.save();

        await updateFinancialEntries('Sales', totalPrice, new Date(), 'add');

        res.status(201).json(newRoomService);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



router.get('/room-services', verifyToken, isAdmin,  async (req, res) => {
    try {
        const roomServices = await RoomService.find().populate('menuId');
        res.json(roomServices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/room-services/:id', verifyToken, isAdmin,  async (req, res) => {
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


router.patch('/room-services/:id', verifyToken, isAdmin,  async (req, res) => {
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

router.get('/room-services/room/:room_no', verifyToken, isAdmin,  async (req, res) => {
    try {
        const roomServices = await RoomService.find({ room_no: req.params.room_no }).populate('menuId');
        if (!roomServices || roomServices.length === 0) {
            return res.status(200).json([]); 
            
        }
        res.json(roomServices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/room-services/:id', verifyToken, isAdmin,  async (req, res) => {
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
