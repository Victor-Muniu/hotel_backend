const express = require('express');
const Website = require('../reservations/website'); 

const router = express.Router();


router.post('/websites', async (req, res) => {
    try {
        const website = new Website(req.body);
        await website.save();
        res.status(201).send(website);
    } catch (error) {
        res.status(400).send(error);
    }
});


router.get('/websites', async (req, res) => {
    try {
        const websites = await Website.find({});
        res.status(200).send(websites);
    } catch (error) {
        res.status(500).send(error);
    }
});


router.get('/websites/:id', async (req, res) => {
    try {
        const website = await Website.findById(req.params.id);
        if (!website) {
            return res.status(404).send();
        }
        res.status(200).send(website);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/websites/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['fname', 'lname', 'email', 'phone_number', 'adults', 'kids', 'no_of_rooms', 'checkin', 'checkout', 'basis', 'room_type'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const website = await Website.findById(req.params.id);
        if (!website) {
            return res.status(404).send();
        }

        updates.forEach((update) => (website[update] = req.body[update]));
        await website.save();
        res.status(200).send(website);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/websites/:id', async (req, res) => {
    try {
        const website = await Website.findByIdAndDelete(req.params.id);
        if (!website) {
            return res.status(404).send();
        }
        res.status(200).send(website);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
