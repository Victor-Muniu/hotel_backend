const express = require('express');
const router = express.Router();
const Assets = require('../accounts/assets');
const GeneralLedger = require('../accounts/general_lenger'); // Corrected typo

async function updatedFinancials(asset) {
    const { amount, category } = asset;
    let ledgerEntry = await GeneralLedger.findOne({ category }); // Corrected

    if (!ledgerEntry) {
        ledgerEntry = new GeneralLedger({
            category,
            date: new Date(),
            amount,
        });
    } else {
        ledgerEntry.amount += amount;
    }

    await ledgerEntry.save();
}

router.post('/assets', async (req, res) => {
    try {
        const { name, group, category, issued, stored, spoilt, price } = req.body;
        const quantity = issued + stored + spoilt;
        const value = quantity * price;
        const amount = value;

        const newAsset = new Assets({
            name,
            group,
            category,
            quantity,
            issued,
            stored,
            spoilt,
            price,
            amount,
            value
        });

        await newAsset.save();
        await updatedFinancials(newAsset);
        res.status(201).json(newAsset);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all assets
router.get('/assets', async (req, res) => {
    try {
        const assets = await Assets.find();
        res.json(assets);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a specific asset
router.get('/assets/:id', async (req, res) => {
    try {
        const asset = await Assets.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json(asset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update an asset
router.patch('/assets/:id', async (req, res) => {
    try {
        const updatedData = req.body;

        // If issued, stored, spoilt, or price are being updated, recalculate quantity and value
        if (updatedData.issued !== undefined || updatedData.stored !== undefined || updatedData.spoilt !== undefined || updatedData.price !== undefined) {
            const asset = await Assets.findById(req.params.id);
            if (!asset) {
                return res.status(404).json({ message: 'Asset not found' });
            }

            const issued = updatedData.issued !== undefined ? updatedData.issued : asset.issued;
            const stored = updatedData.stored !== undefined ? updatedData.stored : asset.stored;
            const spoilt = updatedData.spoilt !== undefined ? updatedData.spoilt : asset.spoilt;
            const price = updatedData.price !== undefined ? updatedData.price : asset.price;

            updatedData.quantity = issued + stored + spoilt;
            updatedData.value = updatedData.quantity * price;
            updatedData.amount = updatedData.value;  // Assuming amount is the same as value for this case
        }

        const updatedAsset = await Assets.findByIdAndUpdate(req.params.id, updatedData, { new: true });
        if (!updatedAsset) {
            return res.status(404).json({ message: 'Asset not found' });
        }

        // Update the ledger entry
        await updatedFinancials(updatedAsset);

        res.json(updatedAsset);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an asset
router.delete('/assets/:id', async (req, res) => {
    try {
        const deletedAsset = await Assets.findByIdAndDelete(req.params.id);
        if (!deletedAsset) {
            return res.status(404).json({ message: 'Asset not found' });
        }
        res.json({ message: 'Asset deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
