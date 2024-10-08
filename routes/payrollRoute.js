const express = require('express');
const router = express.Router();
const Payroll = require('../accounts/payroll.js');

const Expense = require('../accounts/expense.js');

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
        
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'accounts' && user.role !== 'CEO')) {
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

router.post('/payrolls', verifyToken, isAdmin,  async (req, res) => {
    try {
        const { date, gross_income, nhif_deductions, nssf_deductions, paye, helb, housing_Levy, emp_no } = req.body;
        const grossIncome = Number(gross_income);
        const nhifDeductions = Number(nhif_deductions);
        const nssfDeductions = Number(nssf_deductions);
        const payeDeductions = Number(paye);
        const helbDeductions = Number(helb);
        const housingLevy = Number(housing_Levy);

        const net_income = grossIncome - nhifDeductions - nssfDeductions - payeDeductions - helbDeductions - housingLevy;

        const staff = await Staff.findOne({ emp_no });
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const newPayroll = new Payroll({
            date,
            gross_income: grossIncome,
            net_income,
            nhif_deductions: nhifDeductions,
            nssf_deductions: nssfDeductions,
            paye: payeDeductions,
            helb: helbDeductions,
            housing_Levy: housingLevy,
            staff_Id: staff._id
        });

        await newPayroll.save();

        const month = new Date(date).getMonth();
        const year = new Date(date).getFullYear();

        let expense = await Expense.findOne({
            category: 'Salary and Wages',
            date: {
                $gte: new Date(year, month, 1),
                $lt: new Date(year, month + 1, 1)
            }
        });

        if (expense) {
            
            expense.amount = Number(expense.amount) + grossIncome;
            await expense.save();
        } else {
            const newExpense = new Expense({
                category: 'Salary and Wages',
                sub_category: 'Salary and Wages',
                amount: grossIncome,
                date: date 
            });

            await newExpense.save();
            expense = newExpense;
        }

        res.status(201).json({ payroll: newPayroll, expense });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/payrolls', verifyToken, isAdmin,  async (req, res) => {
    try {
        const payrolls = await Payroll.find();
        const payrollsWithNames = await Promise.all(payrolls.map(async (payroll) => {
            const staff = await Staff.findById(payroll.staff_Id);
            if (!staff) return payroll;

            return {
                ...payroll.toObject(),
                fname: staff.fname,
                lname: staff.lname
            };
        }));

        res.json(payrollsWithNames);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/payrolls/:id', verifyToken, isAdmin,  async (req, res) => {
    try {
        const payroll = await Payroll.findById(req.params.id).populate('staff_Id');
        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        const staff = await Staff.findById(payroll.staff_Id);
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const payrollWithName = {
            ...payroll.toObject(),
            fname: staff.fname,
            lname: staff.lname,
            emp_no: staff.emp_no
        };

        res.json(payrollWithName);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/payrolls/:id', verifyToken, isAdmin,  async (req, res) => {
    try {
        const { date, gross_income, nhif_deductions, nssf_deductions, paye, helb, housing_Levy, emp_no } = req.body;

        const grossIncome = Number(gross_income);
        const nhifDeductions = Number(nhif_deductions);
        const nssfDeductions = Number(nssf_deductions);
        const payeDeductions = Number(paye);
        const helbDeductions = Number(helb);
        const housingLevy = Number(housing_Levy);

        const net_income = grossIncome - nhifDeductions - nssfDeductions - payeDeductions - helbDeductions - housingLevy;

        const staff = await Staff.findOne({ emp_no });
        if (!staff) {
            return res.status(404).json({ message: 'Staff not found' });
        }

        const updatedPayroll = await Payroll.findByIdAndUpdate(req.params.id, {
            date,
            gross_income: grossIncome,
            net_income,
            nhif_deductions: nhifDeductions,
            nssf_deductions: nssfDeductions,
            paye: payeDeductions,
            helb: helbDeductions,
            housing_Levy: housingLevy,
            staff_Id: staff._id
        }, { new: true });

        if (!updatedPayroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }

        const month = new Date(date).getMonth();
        const year = new Date(date).getFullYear();
        
        let expense = await Expense.findOne({
            category: 'Salary and Wages',
            date: {
                $gte: new Date(year, month, 1),
                $lt: new Date(year, month + 1, 1)
            }
        });

        if (expense) {
            expense.amount = Number(expense.amount) + net_income;
            await expense.save();
        } else {
            expense = new Expense({
                category: 'Salary and Wages',
                sub_category: 'Salary and Wages',
                amount: net_income,
                date
            });

            await expense.save();
        }

        res.json({ payroll: updatedPayroll, expense });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});



router.delete('/payrolls/:id', verifyToken, isAdmin,  async (req, res) => {
    try {
        const payroll = await Payroll.findByIdAndRemove(req.params.id);
        if (!payroll) {
            return res.status(404).json({ message: 'Payroll not found' });
        }
        res.json({ message: 'Payroll deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
