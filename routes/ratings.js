const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');

// Get all ratings
router.get('/', authenticateToken, requireRole("User"), async (req, res) => {
    try {
        const ratings = await Rating.find();
        res.status(200).json(ratings);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving ratings', error });
    }
});

// Get a specific rating by ID
router.get('/:id', authenticateToken, requireRole("User"), async (req, res) => {
    try {
        const rating = await Rating.findById(req.params.id);
        if (!rating) {
            return res.status(404).json({ message: 'Rating not found' });
        }
        res.status(200).json(rating);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving rating', error });
    }
});

// Get ratings by teacher ID
router.get('/by-teacher/:teacher_id', authenticateToken, requireRole("User"), async (req, res) => {
    const { teacher_id } = req.params;
    console.log(req.params);
    try {
        // Ensure that the teacher_id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(teacher_id)) {
            return res.status(400).json({ message: 'Invalid teacher ID format.' });
        }
        const ratings = await Rating.find({ teacher_id: new mongoose.Types.ObjectId(teacher_id) });
        if (!ratings.length) {
            return res.status(404).json({ message: 'No ratings found for this teacher.' });
        }
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving ratings by teacher', error });
        console.log(error);
    }
});

// Get ratings by course ID
router.get('/by-course/:course_id', authenticateToken, requireRole("User"), async (req, res) => {
    const { course_id } = req.params;
    try {
        // Ensure that the course_id is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(course_id)) {
            return res.status(400).json({ message: 'Invalid course ID format.' });
        }
        const ratings = await Rating.find({ course_id: new mongoose.Types.ObjectId(course_id) });
        if (!ratings.length) {
            return res.status(404).json({ message: 'No ratings found for this course.' });
        }
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving ratings by course', error });
    }
});

// Get ratings by course ID and teacher ID
router.get('/by-course-and-teacher/:course_id/:teacher_id', authenticateToken, requireRole("User"), async (req, res) => {
    const { course_id, teacher_id } = req.params;
    try {
        // Validate both IDs
        if (!mongoose.Types.ObjectId.isValid(course_id) || !mongoose.Types.ObjectId.isValid(teacher_id)) {
            return res.status(400).json({ message: 'Invalid ID format for course or teacher.' });
        }
        const ratings = await Rating.find({
            course_id: new mongoose.Types.ObjectId(course_id),
            teacher_id: new mongoose.Types.ObjectId(teacher_id)
        });
        if (!ratings.length) {
            return res.status(404).json({ message: 'No ratings found for the specified course and teacher.' });
        }
        res.json(ratings);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving ratings by course and teacher', error });
    }
});

// Post a new rating
router.post('/', authenticateToken, requireRole("User"), async (req, res) => {
    const { teacher_id, course_id, rating } = req.body;  // Ensure rating is expected as an array of numbers
    const erp = req.user.erp;

    try {
        // Check if the user has already rated this teacher for this course to prevent duplicate ratings
        const existingRating = await Rating.findOne({ erp, teacher_id, course_id });
        if (existingRating) {
            return res.status(400).json({ message: 'User has already rated this teacher for this course.' });
        }

        // Create a new rating
        const newRating = new Rating({
            erp,
            teacher_id,
            course_id,
            rating, // This should be an array of numbers
        });

        await newRating.save();
        res.status(201).json(newRating);
    } catch (error) {
        res.status(500).json({ message: 'Error creating rating', error: error.message });
    }
});

// Update a specific rating
router.put('/:id', authenticateToken, requireRole("User"), async (req, res) => {
    const { rating } = req.body;  // Expect an array of doubles
    const erp = req.user.erp;

    try {
        const ratingToUpdate = await Rating.findById(req.params.id);
        if (!ratingToUpdate) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        // Assuming 'ratedBy' needs to handle multiple ratings per user, otherwise ensure uniqueness
        if (!ratingToUpdate.ratedBy.includes(erp)) {
            ratingToUpdate.rating = rating;
            ratingToUpdate.ratedBy.push(erp);
            ratingToUpdate.modifiedby = req.user.email;
            ratingToUpdate.modifiedat = new Date();

            await ratingToUpdate.save();
            return res.status(200).json(ratingToUpdate);
        } else {
            return res.status(400).json({ message: 'User has already rated this teacher for this course.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating rating', error });
    }
});

// Delete a specific rating
router.delete('/:id', authenticateToken, requireRole("User"), async (req, res) => {
    try {
        const ratingToDelete = await Rating.findById(req.params.id);
        if (!ratingToDelete) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        if (ratingToDelete.erp !== req.user.erp && !req.user.roles.includes('Admin')) {
            return res.status(403).json({ message: 'Not authorized to delete this rating' });
        }

        await ratingToDelete.remove();
        res.status(200).json({ message: 'Rating deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting rating', error });
    }
});

module.exports = router;
