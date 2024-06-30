const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const xlsx = require('xlsx');
const Transaction = require('../accounts/transaction'); // Adjust path as needed

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.post('/transactions', async (req, res) => {
    try {
        const transaction = new Transaction(req.body);
        await transaction.save();
        res.status(201).send(transaction);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find({});
        res.send(transactions);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).send();
        }
        res.send(transaction);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/transactions/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['date', 'value', 'particulars', 'transaction_cost', 'moneyOut', 'moneyIn', 'balance'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) {
            return res.status(404).send();
        }

        updates.forEach((update) => (transaction[update] = req.body[update]));
        await transaction.save();
        res.send(transaction);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/transactions/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!transaction) {
            return res.status(404).send();
        }
        res.send(transaction);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/upload-excel', upload.single('file'), async (req, res) => {
    if (!req.file || !req.file.buffer) {
        return res.status(400).send('No file uploaded.');
    }

    const dataBuffer = req.file.buffer;

    try {
        const workbook = xlsx.read(dataBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(worksheet);

        // Debugging: Print out keys from the first row of jsonData
        if (jsonData.length > 0) {
            console.log('Keys from Excel data:', Object.keys(jsonData[0]));
        }

        const transactions = jsonData.map(row => ({
            date: row['Date'], // Adjust key names to match those in your Excel sheet
            value: row['Value'], // Adjust key names to match those in your Excel sheet
            particulars: row['Particulars'], // Adjust key names to match those in your Excel sheet
            transaction_cost: row['Transaction Cost'], // Adjust key names to match those in your Excel sheet
            moneyOut: row['Money Out'] ? parseFloat(row['Money Out']) : null,
            moneyIn: row['Money In'] ? parseFloat(row['Money In']) : null,
            balance: row['Balance'] ? parseFloat(row['Balance']) : null
        }));

        await Transaction.insertMany(transactions);
        console.log("Transactions saved successfully.");
        res.status(201).send(transactions);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

module.exports = router;
