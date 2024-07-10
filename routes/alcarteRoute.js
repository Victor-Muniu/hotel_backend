const express = require('express');
const router = express.Router();
const Alcarte = require('../restaurant/alcarte'); 

router.get('/alcarte', async (req, res) => {
    try {
        const alcarteItems = await Alcarte.find();
        res.json(alcarteItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.patch('/alcarte/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updatedItem = await Alcarte.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
