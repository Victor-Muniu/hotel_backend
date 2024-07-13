const express = require('express')
const router = express.Router()
const ClubBill = require('../sales/clubBills')

router.get('/clubBills', async (req, res) => {
    try {
        const bills = await ClubBill.find();
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/clubBills/byStaff/:staffName', async (req, res) => {
    try {
        const bills = await ClubBill.find({ staffName: req.params.staffName });
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/clubBills/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const updatedBill = await ClubBill.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedBill) {
            return res.status(404).json({ message: 'Club bill not found' });
        }
        if (updatedBill.status === 'Cleared') {

            const table = await Table.findById(updatedBill.tableId);

            if (table) {

                table.status = 'Available';
                await table.save();
            }
        }

        res.json(updatedBill);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;