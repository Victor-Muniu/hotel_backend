const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  date: { type: String, required: false },
  value: { type: String, required: false },
  particulars: { type: String, required: false },
  transaction_cost: { type: String, required: false },
  moneyOut: { type: Number, required: false },
  moneyIn: { type: Number, required: false },
  balance: { type: Number, required: false }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
