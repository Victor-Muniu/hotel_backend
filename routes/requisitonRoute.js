const express = require('express');
const router = express.Router();
const Requisition = require('../supplier/requisition'); 
const Item = require('../store/item'); 
const Supplier = require('../supplier/supplier'); 
const Creditors = require('../accounts/creditors');
const GeneralLedger = require('../accounts/general_lenger');
const TrialBalance = require('../accounts/trial_balance');

async function updateLedger(category, date, amount, action = 'add') {
    const ledgerEntry = await GeneralLedger.findOne({ category, date });

    if (!ledgerEntry) {
        const newLedgerEntry = new GeneralLedger({
            category,
            date,
            amount
        });
        await newLedgerEntry.save();
    } else {
        ledgerEntry.amount = action === 'add' ? ledgerEntry.amount + amount : ledgerEntry.amount - amount;
        await ledgerEntry.save();
    }
}

async function updateTrialBalance(groupName, amount, date, action = 'add') {
    const year = date.getFullYear();

    let trialBalanceEntry = await TrialBalance.findOne({ group_name: groupName, Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } });

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

    await trialBalanceEntry.save();
}

router.post('/requisitions', async (req, res) => {
    try {
        const { itemName, supplierName, quantity, unit_price } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const supplier = await Supplier.findOne({ name: supplierName });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const amount = quantity * unit_price;

        const newRequisition = new Requisition({
            itemId: item._id,
            supplierId: supplier._id,
            date: new Date(),
            quantity,
            unit_price,
            amount
        });

        await newRequisition.save();

        const newCreditor = new Creditors({
            requisitionID: newRequisition._id
        });

        await newCreditor.save();

        await updateLedger('Creditors', new Date(), amount, 'add');
        await updateTrialBalance('Creditors', amount, new Date(), 'add');

        res.status(201).json(newRequisition);
    } catch (err) {
        console.error('Error saving requisition:', err);
        res.status(400).json({ message: err.message });
    }
});

router.get('/requisitions', async (req, res) => {
    try {
        const requisitions = await Requisition.find().populate('itemId').populate('supplierId');
        const populatedRequisitions = requisitions.map(req => ({
            ...req.toObject(),
            itemName: req.itemId ? req.itemId.name : null,
            supplierName: req.supplierId ? req.supplierId.name : null
        }));
        res.json(populatedRequisitions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/requisitions/:id', async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id).populate('itemId').populate('supplierId');
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }
        res.json({
            ...requisition.toObject(),
            itemName: requisition.itemId ? requisition.itemId.name : null,
            supplierName: requisition.supplierId ? requisition.supplierId.name : null
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/requisitions/by-names', async (req, res) => {
    try {
        const { itemName, supplierName } = req.query;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const supplier = await Supplier.findOne({ name: supplierName });
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const requisitions = await Requisition.find({ itemId: item._id, supplierId: supplier._id }).populate('itemId').populate('supplierId');
        const populatedRequisitions = requisitions.map(req => ({
            ...req.toObject(),
            itemName: req.itemId ? req.itemId.name : null,
            supplierName: req.supplierId ? req.supplierId.name : null
        }));
        res.json(populatedRequisitions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/requisitions/:id', async (req, res) => {
    try {
        const { itemName, supplierName, quantity, unit_price } = req.body;

        const requisition = await Requisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        if (itemName) {
            const item = await Item.findOne({ name: itemName });
            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }
            req.body.itemId = item._id;
        }

        if (supplierName) {
            const supplier = await Supplier.findOne({ name: supplierName });
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found' });
            }
            req.body.supplierId = supplier._id;
        }

        if (quantity && unit_price) {
            req.body.amount = quantity * unit_price;
        }

        const updatedRequisition = await Requisition.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('itemId').populate('supplierId');
        res.json({
            ...updatedRequisition.toObject(),
            itemName: updatedRequisition.itemId ? updatedRequisition.itemId.name : null,
            supplierName: updatedRequisition.supplierId ? updatedRequisition.supplierId.name : null
        });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/requisitions/:id', async (req, res) => {
    try {
        const requisition = await Requisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }

        const creditor = await Creditors.findOne({ requisitionID: requisition._id });
        if (!creditor) {
            return res.status(404).json({ message: 'Creditor not found' });
        }

        await updateLedger('Creditors', requisition.date, requisition.amount, 'subtract');
        await updateTrialBalance('Creditors', requisition.amount, requisition.date, 'subtract');

        await creditor.deleteOne();
        await requisition.deleteOne();

        res.json({ message: 'Requisition and corresponding ledger entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
