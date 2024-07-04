const express = require('express');
const router = express.Router();
const RoomService = require('../reservations/room_service');
const Menu = require('../models/menu');



router.post('/room-services', async (req, res) => {
    try {
        const { menuItems, delivery_fee, room_no } = req.body;

        
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
        

        const newRoomService = new RoomService({
            menuId: menuIds,
            delivery_fee: delivery_fee || 500,
            total: totalPrice,
            room_no: room_no
        });

        await newRoomService.save();
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
