const express = require('express');
const router = express.Router();
const BanquettingInvoice = require('../banquetting/banquettingInvoice');
const Banquetting = require('../banquetting/banquetting');


router.post('/banquettinginvoices', async (req, res) => {
    try {
        const { banquettingName, packs, Totalamount } = req.body;

        const banquetting = await Banquetting.findOne({ name: banquettingName });
        if (!banquetting) {
            return res.status(404).json({ message: 'Banquetting not found' });
        }

        const newBanquettingInvoice = new BanquettingInvoice({
            banquettingId: banquetting._id,
            packs,
            Totalamount
        });


        await newBanquettingInvoice.save();

        res.status(201).json(newBanquettingInvoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/banquettinginvoices', async (req, res) => {
    try {
        const banquettingInvoices = await BanquettingInvoice.find();
        res.json(banquettingInvoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/banquettinginvoices/:name', async (req, res) => {
    try {
        const banquettingName = req.params.name;
        const banquetting = await Banquetting.findOne({ name: banquettingName });
        if (!banquetting) {
            return res.status(404).json({ message: 'Banquetting not found' });
        }

        const banquettingInvoices = await BanquettingInvoice.find({ banquettingId: banquetting._id });
        res.json(banquettingInvoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// PATCH: Update a banquetting invoice by ID
router.patch('/banquettinginvoices/:id', async (req, res) => {
    try {
        const updatedBanquettingInvoice = await BanquettingInvoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedBanquettingInvoice) {
            return res.status(404).json({ message: 'Banquetting invoice not found' });
        }
        res.json(updatedBanquettingInvoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE: Delete a banquetting invoice by ID
router.delete('/banquettinginvoices/:id', async (req, res) => {
    try {
        const deletedBanquettingInvoice = await BanquettingInvoice.findByIdAndDelete(req.params.id);
        if (!deletedBanquettingInvoice) {
            return res.status(404).json({ message: 'Banquetting invoice not found' });
        }
        res.json({ message: 'Banquetting invoice deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
