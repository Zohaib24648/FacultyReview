const express = require('express');
const router = express.Router();

// Import required middleware
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');

// Adjust the path as necessary to point to where your middleware is defined

// Import the Course model
const Courses = require('../models/Course');
const Teachers= require('../models/Teacher');
// Adjust the path as necessary to point to your Course model

// /**
//  * Create a new course
//  */
// router.post('/', authenticateToken, requireRole("Moderator"), async (req, res) => {
//     // Implement logic to create a new course
//     // Ensure the user has the necessary role to create a course
// });

// /**
//  * Update an existing course
//  */
// router.patch('/:courseId', authenticateToken, requireRole("Moderator"), async (req, res) => {
//     // Implement logic to update an existing course
//     // Check if the logged-in user has the necessary role to update a course
// });

// /**
//  * Delete a course
//  */
// router.delete('/:courseId', authenticateToken, requireRole("Moderator"), async (req, res) => {
//     // Implement logic to delete a course
//     // Check if the logged-in user has the necessary role to delete a course
// });

router.get('/getallcourses', authenticateToken, requireRole("User"), async (req, res) => {
    try {
      const courses = await Courses.find({}); // Finds all courses
      res.status(200).json(courses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error", error: error.message });
    }
  });
  router.post('/getteachersforcourse', authenticateToken, requireRole("User"), async (req, res) => {
    try {
      const { course_id } = req.body;
  
      if (!course_id) {
        return res.status(400).json({ msg: "Course ID is required." });
      }
  
      // First, find the course by its ID to get the list of teacher IDs
      const course = await Courses.findById(course_id);
  
      if (!course) {
        return res.status(404).json({ msg: "Course not found." });
      }
  
      // Extract teacher Object IDs from the course document
      const teacherIds = course.Teachers;
  
      // Then, find all teachers whose IDs are in the course's Teachers array
      const teachers = await Teachers.find({
        '_id': { $in: teacherIds }
      });
  
      if (teachers.length === 0) {
        return res.status(404).json({ msg: "No teachers found for this course." });
      }
  
      res.status(200).json(teachers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error", error: error.message });
    }
  });
  
// Export the router to use in your app.js
module.exports = router;
