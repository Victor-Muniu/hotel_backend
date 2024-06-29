const express = require('express');
const router = express.Router();
const Creditors = require('../accounts/creditors');
const Requisition = require('../supplier/requisition');
const Supplier = require('../supplier/supplier');
const Item = require('../store/item');


router.get('/creditors', async (req, res) => {
    try {
        
        const creditors = await Creditors.find();

        const creditorsWithDetails = await Promise.all(creditors.map(async (creditor) => {
            const requisition = await Requisition.findById(creditor.requisitionID);
            if (!requisition) {
                return { message: 'No requisition found for this creditor' };
            }

            const supplier = await Supplier.findById(requisition.supplierId);
            const item = await Item.findById(requisition.itemId);

            return {
                _id: creditor._id,
                requisitionID: creditor.requisitionID,
                supplierName: supplier ? supplier.name : 'Supplier not found',
                itemName: item ? item.name : 'Item not found',
                date: requisition.date,
                unitPrice: requisition.unit_price,
                amount: requisition.amount
            };
        }));

        res.json(creditorsWithDetails);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/creditors/:id', async (req, res) => {
    try {
        const creditor = await Creditors.findById(req.params.id);
        if (!creditor) {
            return res.status(404).json({ message: 'Creditor not found' });
        }

        const requisition = await Requisition.findById(creditor.requisitionID);
        if (!requisition) {
            return res.status(404).json({ message: 'No requisition found for this creditor' });
        }

        const supplier = await Supplier.findById(requisition.supplierId);
        const item = await Item.findById(requisition.itemId);

        const creditorWithDetails = {
            _id: creditor._id,
            requisitionID: creditor.requisitionID,
            supplierName: supplier ? supplier.name : 'Supplier not found',
            itemName: item ? item.name : 'Item not found',
            date: requisition.date,
            unitPrice: requisition.unit_price,
            amount: requisition.amount
        };

        res.json(creditorWithDetails);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/creditors/by-supplier/:supplierName', async (req, res) => {
    try {
        const supplierName = req.params.supplierName;

        const requisitions = await Requisition.find();
        const creditors = await Creditors.find();

        const creditorsWithDetails = [];
        for (const creditor of creditors) {
            const requisition = requisitions.find(req => req._id.toString() === creditor.requisitionID.toString());
            if (requisition) {
                const supplier = await Supplier.findById(requisition.supplierId);
                if (supplier && supplier.name === supplierName) {
                    const item = await Item.findById(requisition.itemId);
                    const creditorDetails = {
                        _id: creditor._id,
                        requisitionID: creditor.requisitionID,
                        supplierName: supplier.name,
                        itemName: item ? item.name : 'Item not found',
                        date: requisition.date,
                        unitPrice: requisition.unit_price,
                        amount: requisition.amount
                    };
                    creditorsWithDetails.push(creditorDetails);
                }
            }
        }

        if (creditorsWithDetails.length === 0) {
            return res.status(404).json({ message: 'No creditors found for this supplier' });
        }

        res.json(creditorsWithDetails);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
