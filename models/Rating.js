const mongoose = require('mongoose');
const { erpValidator } = require('../utils/validators');
const ratingSchema = new mongoose.Schema({
    erp: {
        type: Number,
        required: true,
        validate: erpValidator
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId, // Adjusted to ObjectId
        required: true,
        ref: 'Teacher'
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId, // Adjusted to ObjectId
        required: true,
        ref: 'Course'
    },
    rating: {
        type: [Number],
        required: true,
        validate: ratings => ratings.length === 4 && ratings.every(r => r >= 0 && r <= 5)
    },
});

ratingSchema.index({ erp: 1, teacher_id: 1, course_id: 1 }, { unique: true });


const Rating = mongoose.model('Rating', ratingSchema);
module.exports = Rating;
