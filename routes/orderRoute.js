const express = require('express');
const router = express.Router();
const Table = require('../models/table');
able
router.post('/tables', async (req, res) => {
    try {
        const newTable = new Table(req.body);
        await newTable.save();
        res.status(201).json(newTable);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/tables', async (req, res) => {
    try {
        const tables = await Table.find();
        res.json(tables);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/tables/:id', async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.json(table);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/tables/:id', async (req, res) => {
    try {
        const updatedTable = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedTable) {
            return res.status(404).json({ message: 'Table not found' });
        }
        res.json(updatedTable);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/tables/:id', async (req, res) => {
    try {
        const table = await Table.findById(req.params.id);
        if (!table) {
            return res.status(404).json({ message: 'Table not found' });
        }
        await table.deleteOne();
        res.json({ message: 'Table deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
