const express = require('express');
const router = express.Router();
const ReservationBills = require('../sales/reservationsBills');
const Reservation = require('../reservations/reservation');
const TrialBalance = require('../accounts/trial_balance');
const ProfitLoss = require('../accounts/profit&loss');
const Sales = require('../accounts/sales')

const Staff = require('../models/staff')
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: Missing token' });
    }
    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        if (!decoded || !decoded.user || !decoded.user.emp_no) {
            console.log('Token does not contain user information');
            return res.status(403).json({ message: 'Unauthorized: Invalid token' });
        }
        req.userEmpNo = decoded.user.emp_no; 
        
        next();
    } catch (err) {
        res.clearCookie('token', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
        });
        console.log('Token verification error:', err.message);
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
    }
}


async function isAdmin(req, res, next) {
    try {
        console.log('User emp_no from token:', req.userEmpNo); 
        
        const user = await Staff.findOne({ emp_no: req.userEmpNo }); 
        console.log('User fetched from database:', user); 
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'front office' && user.role !== 'house keeping' )) {
            console.log('User is not admin');
            return res.status(403).json({ message: 'Unauthorized: Only admin users can perform this action' });
        }
        
        console.log('User is Admin');
        next(); 
    } catch (err) {
        console.error('Error in isAdmin middleware:', err.message);
        res.status(500).json({ message: err.message });
    }
}

async function updateFinancialEntries(groupName, amount, date, action = 'add') {
    const year = date.getFullYear();

    let trialBalanceEntry = await TrialBalance.findOne({
        group_name: groupName,
        Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    });
    let profitLossEntry = await ProfitLoss.findOne({
        group_name: groupName,
        Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) }
    });

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

    if (!profitLossEntry) {
        profitLossEntry = new ProfitLoss({
            group_name: groupName,
            Debit: 0,
            Credit: action === 'add' ? amount : 0,
            Date: new Date(year, 0, 1)
        });
    } else {
        profitLossEntry.Credit = action === 'add' ? profitLossEntry.Credit + amount : profitLossEntry.Credit - amount;
    }

    await trialBalanceEntry.save();
    await profitLossEntry.save();
}


router.post('/reservation-bills', verifyToken, isAdmin,  async (req, res) => {
    const { reservationID, total_amount,  package_price } = req.body;
    try {
        const reservation = await Reservation.findById(reservationID);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        const total_amount = package_price.reduce((acc, price) => acc + price, 0)

        const newBill = new ReservationBills({ reservationID,package_price, total_amount });
        await newBill.save();

        const newSale = new Sales({
            reservationsBillsId : newBill._id,
            amount: total_amount
        });

        await newSale.save();

       
        await updateFinancialEntries('Sales', total_amount, new Date(), 'add')
        res.status(201).json(newBill);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/reservation-bills', verifyToken, isAdmin,  async (req, res) => {
    try {
        const bills = await ReservationBills.find().populate('reservationID');
        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/reservation-bills/:id', verifyToken, isAdmin,  async (req, res) => {
    const { id } = req.params;
    try {
        const bill = await ReservationBills.findById(id).populate('reservationID');
        if (!bill) {
            return res.status(404).json({ message: 'Reservation bill not found' });
        }
        res.json(bill);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/reservation-bills/room/:room_no', verifyToken, isAdmin,  async (req, res) => {
    const { room_no } = req.params;
    try {
        const reservations = await Reservation.find({ room_no: room_no });
        if (!reservations || reservations.length === 0) {
            return res.status (200).json([])
        }

        const reservationIDs = reservations.map(reservation => reservation._id);
        const bills = await ReservationBills.find({ reservationID: { $in: reservationIDs } }).populate('reservationID');
        
        if (!bills || bills.length === 0) {
            return res.status(200).json([]);
        }

        res.json(bills);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/reservation-bills/:id', verifyToken, isAdmin,  async (req, res) => {
    const { id } = req.params;
    try {
        const deletedBill = await ReservationBills.findByIdAndDelete(id);
        if (!deletedBill) {
            return res.status(404).json({ message: 'Reservation bill not found' });
        }
        res.json({ message: 'Reservation bill deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
