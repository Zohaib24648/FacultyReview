const mongoose = require('mongoose');
const { emptyValidator, erpValidator } = require('../utils/validators');

const commentSchema = new mongoose.Schema({
    erp: {
        type: Number,
        required: true,
        validate: erpValidator
    },
    name: {
        type: String,
        required: true,
        validate: emptyValidator
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    comment: {
        type: String,
        validate: emptyValidator
    },
    anonymous: {
        type: Boolean,
        required: true
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId, // Adjusted to ObjectId
        ref: 'Teacher'
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId, // Adjusted to ObjectId
        ref: 'Course'
    },
    upvotes: {
        type: Number,
        default: 0
    },
    downvotes: {
        type: Number,
        default: 0
    },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Adjusted to ObjectId with ref
    downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Adjusted to ObjectId with ref
    createdby: { type: String, default: "" },
    modifiedby: { type: String, default: "" },
    createdat: { type: Date, default: Date.now },
    modifiedat: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false }
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
