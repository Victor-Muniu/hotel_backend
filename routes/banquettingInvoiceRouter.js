const express = require('express');
const router = express.Router();
const BanquettingInvoice = require('../banquetting/banquettingInvoice');
const Banquetting = require('../banquetting/banquetting');


function calculateTotalAmount(prices, discounts, packs) {
    let totalAmount = 0;
    for (let i = 0; i < prices.length; i++) {
        const price = prices[i];
        const discount = discounts[i] || 0;
        const pack = packs[i];
        totalAmount += (price - discount) * pack;
    }
    return totalAmount;
}

router.post('/banquettinginvoices', async (req, res) => {
    try {
        const { booking_no, discount, price, packs, Totalamount } = req.body;

        const banquetting = await Banquetting.findOne({ booking_no: booking_no });
        if (!banquetting) {
            return res.status(404).json({ message: 'Banquetting not found' });
        }

        const calculatedTotalAmount = Totalamount || calculateTotalAmount(price, discount, packs);

        const newBanquettingInvoice = new BanquettingInvoice({
            banquettingId: banquetting._id,
            discount,
            price,
            packs,
            Totalamount: calculatedTotalAmount
        });

        await newBanquettingInvoice.save();
        res.status(201).json(newBanquettingInvoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/banquettinginvoices', async (req, res) => {
    try {
        const banquettingInvoices = await BanquettingInvoice.find().populate('banquettingId');
        if (!banquettingInvoices.length) {
            return res.status(404).json({ message: 'No banquetting invoices found' });
        }

        const response = await Promise.all(banquettingInvoices.map(async invoice => {
            const banquetting = await Banquetting.findById(invoice.banquettingId);
            return {
                invoiceId: invoice._id,
                discount: invoice.discount,
                price: invoice.price,
                packs: invoice.packs,
                Totalamount: invoice.Totalamount,
                banquettingDetails: banquetting ? {
                    booking_no: banquetting.booking_no,
                    name: banquetting.name,
                    workshopName: banquetting.workshopName,
                    reservedDates: banquetting.reservedDates,
                    checkout: banquetting.checkout
                } : {}
            };
        }));

        res.json(response);
    } catch (err) {
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

router.get('/banquettinginvoices/:id', async (req, res) => {
    try {
        const banquettingInvoiceId = req.params.id;

        const banquettingInvoice = await BanquettingInvoice.findById(banquettingInvoiceId);
        if (!banquettingInvoice) {
            return res.status(404).json({ message: 'Banquetting invoice not found' });
        }

        const banquettingId = banquettingInvoice.banquettingId;
        const banquetting = await Banquetting.findById(banquettingId);
        if (!banquetting) {
            return res.status(404).json({ message: 'Banquetting not found' });
        }

        const response = {
            banquettingId: banquetting._id,
            booking_no: banquetting.booking_no,
            name: banquetting.name,
            workshopName: banquetting.workshopName,
            reservedDates: banquetting.reservedDates,
            checkout: banquetting.checkout,
            prices: banquettingInvoice.price,
            packs: banquettingInvoice.packs,
            Totalamount: banquettingInvoice.Totalamount
        };

        res.json(response);
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
