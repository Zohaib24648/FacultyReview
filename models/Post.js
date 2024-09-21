const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    // Creator of the post
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // For replies, this will reference the parent post's ObjectId
    parentPost: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    // Categories/tags could be useful for filtering posts by subject, e.g., 'Mathematics', 'Engineering'
    tags: [{
        type: String,
        default: []
    }],
    // To maintain a count of likes and dislikes
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    // Users who liked or disliked the post
    upvotedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    downvotedBy: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: []
    }],
    // To handle visibility of the post
    visibility: {
        type: String,
        enum: ['Public', 'Private'],
        default: 'Public'
    },
    anonymous: {
        type: Boolean,
        default: false
    },
    // Tracking modifications
    modifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Timestamps for post creation and last modification
    createdAt: {
        type: Date,
        default: Date.now
    },
    modifiedAt: {
        type: Date,
        default: Date.now
    },
    // Marking posts as deleted without actually removing them from the database
    isDeleted: {
        type: Boolean,
        default: false
    },
    // Attachments such as images or files
    attachments: [{
        type: String, // Assuming URLs or references to files stored elsewhere
        default: []
    }],
    // Comments on the post
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        default: []
    }]
});

// Create an index for better search performance
postSchema.index({ title: 'text', content: 'text', tags: 'text' });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
