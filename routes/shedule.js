const cron = require('node-cron');
const mongoose = require('mongoose');
const Item = require('../store/item');
const StockValue = require('../accounts/stock_value');
const ProfitLoss = require('../accounts/profit&loss'); 

cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Running daily opening stock value collection task...');

        const items = await Item.find();
        let totalValue = 0;
        items.forEach(item => {
            totalValue += item.value;
        });

        console.log(`Total item value: ${totalValue}`);

        const newStockValue = new StockValue({
            date: new Date(),
            amount: totalValue
        });
        await newStockValue.save();

        await updateProfitLoss('Opening Stock', totalValue, new Date());

        console.log('Daily opening stock value collection task complete.');
    } catch (err) {
        console.error('Error running daily opening stock value collection task:', err.message);
    }
}, {
    timezone: 'Africa/Nairobi'
});

async function updateProfitLoss(groupName, amount, date) {
    const year = date.getFullYear();

    let profitLossEntry = await ProfitLoss.findOne({
        group_name: groupName,
        Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    });

    if (!profitLossEntry) {
        profitLossEntry = new ProfitLoss({
            group_name: groupName,
            Debit: amount,
            Credit: 0,
            Date: new Date(year, 0, 1)
        });
    } else {
        profitLossEntry.Credit += amount;
    }

    await profitLossEntry.save();
}
