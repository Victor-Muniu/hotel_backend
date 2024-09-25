const express = require('express')
const router = express.Router()
const PettyCash = require('../accounts/pattyCash')
const BalanceSheet = require('../accounts/balancesheet')

async function updateBalanceSheet(asset) {
    const { date, amount } = asset;
    const recordName =  'PettyCash';

    let balanceSheetEntry = await BalanceSheet.findOne({ name: recordName });

    if (!balanceSheetEntry) {
        balanceSheetEntry = new BalanceSheet({
            name: recordName,
            category: 'Current Assets',
            amount,
            date: date
        });
        
    } else {
        balanceSheetEntry.amount += amount;
    }

    console.log(balanceSheetEntry)

    await balanceSheetEntry.save();
}


router.post('/petty_cash',  async (req, res)=>{
    try {
        const { name, amount } = req.body;
        const pettyCash = new PettyCash({ name, amount });
        await pettyCash.save();
        await updateBalanceSheet(pettyCash)
        res.status(201).json(pettyCash);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
});

router.get('/petty_cash', async(req, res)=>{
    try {
        const pettyCashList = await PettyCash.find();
        res.json(pettyCashList);
      } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

router.patch('/petty_cash/:id', async(req,res)=>{
    try {
        const { id } = req.params;
        const { name, amount } = req.body;
        const updatedPettyCash = await PettyCash.findByIdAndUpdate(
          id,
          { name, amount },
          { new: true }
        );
        if (!updatedPettyCash) {
          return res.status(404).json({ message: 'Petty cash not found' });
        }
        res.json(updatedPettyCash);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
})


router.delete('/petty_cash/:id', async(req, res)=>{
    try {
        const { id } = req.params;
        const deletedPettyCash = await PettyCash.findByIdAndDelete(id);
        if (!deletedPettyCash) {
          return res.status(404).json({ message: 'Petty cash not found' });
        }
        res.json({ message: 'Petty cash deleted successfully' });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
})


module.exports =router