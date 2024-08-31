const express = require('express');
const Comment = require('../models/comments'); 

const router = express.Router();


router.post('/comments', async (req, res) => {
    try {
        const comment = new Comment(req.body);
        await comment.save();
        res.status(201).send(comment);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/comments', async (req, res) => {
    try {
        const comments = await Comment.find({}).populate('blogID');
        res.send(comments);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/comments/:id', async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id).populate('blogID');
        if (!comment) {
            return res.status(404).send();
        }
        res.send(comment);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.patch('/comments/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['comment', 'fname', 'lname', 'email'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).send();
        }

        updates.forEach(update => comment[update] = req.body[update]);
        await comment.save();
        res.send(comment);
    } catch (error) {
        res.status(400).send(error);
    }
});


router.delete('/comments/:id', async (req, res) => {
    try {
        const comment = await Comment.findByIdAndDelete(req.params.id);
        if (!comment) {
            return res.status(404).send();
        }
        res.send(comment);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;
