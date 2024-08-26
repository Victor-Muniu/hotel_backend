const express = require('express');
const router = express.Router();
const Blog = require('../models/blog')


router.post('/blogs', async (req, res) => {
    try {
        const blog = new Blog(req.body);
        await blog.save();
        res.status(201).send(blog);
    } catch (error) {
        res.status(400).send(error);
    }
});


router.get('/blogs', async (req, res) => {
    try {
        const blogs = await Blog.find({});
        res.status(200).send(blogs);
    } catch (error) {
        res.status(500).send(error);
    }
});


router.get('/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).send();
        }
        res.status(200).send(blog);
    } catch (error) {
        res.status(500).send(error);
    }
});


router.patch('/blogs/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['title', 'author', 'content', 'tags', 'pictures', 'videos', 'likes', 'comments'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).send();
        }

        updates.forEach((update) => blog[update] = req.body[update]);
        await blog.save();
        res.status(200).send(blog);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/blogs/:id', async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        if (!blog) {
            return res.status(404).send();
        }
        res.status(200).send(blog);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;