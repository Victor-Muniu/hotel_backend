const express = require('express');
const router = express.Router();
const RestaurantRequisition = require('../requisition/restaurantRequisition');
const Item = require('../store/item');
const Alcarte = require('../restaurant/alcarte');

const Staff = require('../models/staff')
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next){
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({message: 'Unauthorized: Missing token'});
    }
    try {
        const decoded = jwt.verify(token, 'your_secret_key');
        req.userId = decoded.user.emp_no;
        console.log('User ID:' , req.userId);
        next();
    }catch (err){
        res.clearCookie('token', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production'
        });
        return res.status(403).json({ message: 'Unauthorized: Invalid token' });
        
    }
}

async function isAdmin(req, res, next){
    try{
        const user = await Staff.findOne({emp_no: req.userId});
        console.log('User', user);
        if (!user || (user.role !== 'admin' && user.role !== 'super admin' && user.role !== 'service' && user.role !== 'procurement' )){
            console.log('User is not admin');
            return res.status(403).json({message: "Unauthorized: Only admin users can perform this action"});
            
        }
        console.log('User is Admin')
    } catch (err){
        res.status(500).json({message: err.message});
    }
} 


router.post('/restaurantRequisitions', verifyToken, isAdmin, async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const newRequisition = new RestaurantRequisition({
            itemID: item._id,
            quantity,
            unit,
            description,
            date,
            department,
            status
        });

        await newRequisition.save();

        res.status(201).json(newRequisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.patch('/restaurantRequisitions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { itemName, quantity, unit, description, date, department, status } = req.body;

        const item = await Item.findOne({ name: itemName });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (status === 'Approved') {
            if (item.quantity < quantity) {
                return res.status(400).json({ message: 'Insufficient quantity in stock' });
            }


            
            let alcarte = await Alcarte.findOne({ name: item.name });

            if (alcarte) {

                alcarte.quantity += quantity;
                alcarte.value += item.unit_price * quantity;
            } else {
          
                alcarte = new Alcarte({
                    name: item.name,
                    description: item.description,
                    group: item.group,
                    unit_price: item.unit_price,
                    quantity: quantity,
                    spoilt: item.spoilt,
                    value: item.unit_price * quantity,
                    date: new Date()
                });
            }

            await alcarte.save();

            item.quantity -= quantity;
            await item.save();
        }

        const updatedRequisition = await RestaurantRequisition.findByIdAndUpdate(
            req.params.id,
            {
                itemID: item._id,
                quantity,
                unit,
                description,
                date,
                department,
                status
            },
            { new: true }
        );

        res.json(updatedRequisition);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
router.get('/restaurantRequisitions', verifyToken, isAdmin, async (req, res) => {
    try {
        const requisitions = await RestaurantRequisition.find().populate('itemID', 'name');
        res.json(requisitions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/restaurantRequisitions/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const requisition = await RestaurantRequisition.findById(req.params.id);
        if (!requisition) {
            return res.status(404).json({ message: 'Requisition not found' });
        }
        await requisition.deleteOne();
        res.json({ message: 'Requisition deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
