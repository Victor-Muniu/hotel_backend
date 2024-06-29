const express = require('express');
const Menu = require('../models/menu'); 
const router = express.Router();

router.post('/menus', async (req, res) => {
    try {
        const newMenuItem = new Menu(req.body);
        await newMenuItem.save();
        res.status(201).json(newMenuItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/menus', async (req, res) => {
    try {
        const menus = await Menu.find();
        res.json(menus);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/menus/:id', async (req, res) => {
    try {
        const menu = await Menu.findById(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(menu);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/menus/:id', async (req, res) => {
    try {
        const updatedMenu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedMenu) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(updatedMenu);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/menus/:id', async (req, res) => {
    try {
        const menu = await Menu.findByIdAndDelete(req.params.id);
        if (!menu) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json({ message: 'Menu item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
