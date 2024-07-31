const express = require('express');
const router = express.Router();
const Payroll = require('../accounts/payroll.js');
const Staff = require('../models/staff.js');
const Expense = require('../accounts/expense.js');

router.post('/payrolls', async (req, res) => {
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


router.get('/payrolls', async (req, res) => {
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

router.get('/payrolls/:id', async (req, res) => {
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

router.patch('/payrolls/:id', async (req, res) => {
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



router.delete('/payrolls/:id', async (req, res) => {
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
