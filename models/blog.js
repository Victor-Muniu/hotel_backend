const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    tags: {
        type: [String], 
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now 
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: Number,
        default: 0
    },
    pictures: {
        type: [String], 
        required: false
    },
    videos: {
        type: [String], 
        required: false
    },
});

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;
