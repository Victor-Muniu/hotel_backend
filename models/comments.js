const mongoose = require('mongoose');

const commentsSchema = new mongoose.Schema({
    blogID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog',
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    fname: {
        type: String,
        required: true
    },
    lname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

const Comment = mongoose.model('Comment', commentsSchema);
module.exports = Comment;
