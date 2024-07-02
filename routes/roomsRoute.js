const express = require('express');
const jwt = require('jsonwebtoken');
const Staff = require('../models/staff.js');
const Room = require('../house_keeping/rooms.js');
const router = express.Router();

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }

    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        req.userId = decoded.user.emp_no;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
}

async function isAdmin(req, res, next) {
    try {
        const user = await Staff.findOne({ emp_no: req.userId });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: Only admin users can perform this action' });
        }
        next();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// Create a new room
router.post('/rooms', async (req, res) => {
    try {
        const newRoom = new Room(req.body);
        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/rooms', async (req, res) => {
    try {
        const rooms = await Room.find();
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/rooms/:id', async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(room);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a room by ID
router.patch('/rooms/:id', async (req, res) => {
    try {
        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedRoom) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(updatedRoom);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.delete('/rooms/:id', async (req, res) => {
    try {
        const room = await Room.findByIdAndRemove(req.params.id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json({ message: 'Room deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;