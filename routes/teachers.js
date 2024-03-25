const express = require('express');
const router = express.Router();

// Import required middleware
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');
// Adjust the path as necessary to point to where your middleware is defined

// Import the Teacher model
const Teachers = require('../models/Teacher');
// Adjust the path as necessary to point to your Teacher model
const Courses = require('../models/Course');

router.post('/createTeacher', authenticateToken, requireRole("Moderator"), async (req, res) => {
    try {
      const { Name, Title, Email, Overview, CoursesTaught, Department, Specialization, OnboardStatus, ImageFile } = req.body;
      
      // For demonstration, using a static email. In a real app, derive this from the authenticated user.
      const user = "zohaibalimughal7@gmail.com";
  
      // Convert course names to ObjectIds
      const courses = await Courses.find({ 'Course_name': { $in: CoursesTaught } });
      const CoursesTaughtIDs = courses.map(course => course._id);
  
      // Check if all provided course names were found as valid courses
      if (CoursesTaught.length !== CoursesTaughtIDs.length) {
        return res.status(400).json({ msg: "One or more courses not found." });
      }
  
      const newTeacher = await Teachers.create({
        Name,
        Title,
        Email,
        Overview,
        CoursesTaught,
        CoursesTaughtIDs, // Include the array of course ObjectIds
        Department,
        Specialization,
        OnboardStatus,
        ImageFile,
        createdBy: user,
        modifiedBy: user,
        createdAt: new Date(),
        modifiedAt: new Date(),
        isDeleted: false // Explicitly set, though default value is false as per schema
      });
  
      res.json({ msg: "Teacher created successfully", teacher: newTeacher });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  });
  
  
  router.patch('/updateTeacher', authenticateToken, requireRole("Moderator"), async (req, res) => {
    try {
      const { id, Name, Title, Email, Overview, CoursesTaught, Department, Specialization, OnboardStatus, ImageFile } = req.body;
  
      // For demonstration, using a static email. In a real app, derive this from the authenticated user.
      const user = "zohaibalimughal7@gmail.com";
  
      let updateData = {
        ...(Name && {Name}),
        ...(Title && {Title}),
        ...(Email && {Email}),
        ...(Overview && {Overview}),
        ...(Department && {Department}),
        ...(Specialization && {Specialization}),
        ...(OnboardStatus && {OnboardStatus}),
        ...(ImageFile && {ImageFile}),
        modifiedBy: user,
        modifiedAt: new Date(),
      };
  
      // If CoursesTaught is provided, convert course names to ObjectIds
      if (CoursesTaught && CoursesTaught.length > 0) {
        const courses = await Courses.find({ 'Course_name': { $in: CoursesTaught } });
        const CoursesTaughtIDs = courses.map(course => course._id);
  
        // Check if all provided course names were found as valid courses
        if (CoursesTaught.length !== CoursesTaughtIDs.length) {
          return res.status(400).json({ msg: "One or more courses not found." });
        }
  
        updateData.CoursesTaught = CoursesTaught;
        updateData.CoursesTaughtIDs = CoursesTaughtIDs;
      }
  
      const updatedTeacher = await Teachers.findByIdAndUpdate(id, updateData, { new: true });
  
      if (!updatedTeacher) {
        return res.status(404).json({ msg: "Teacher not found." });
      }
  
      res.json({ msg: "Teacher updated successfully", teacher: updatedTeacher });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  });
  
  
  router.delete('/deleteteacher', authenticateToken,requireRole("Moderator"), async (req, res) => {
    try {
      const { objectId } = req.body;
      const teacherToDelete = await Teachers.findById(objectId);
  
      if (!teacherToDelete) {
        return res.status(404).json({ msg: "teacher not found" });
      }
  
      // Check if the user is an Admin/Moderator or if the ERP matches
      const hasPermission = req.user.roles.includes('Admin') || 
                            req.user.roles.includes('Moderator')
  
  
      if (!hasPermission) {
        return res.status(403).json({ msg: "Not authorized to delete this teacher" });
      }
  
      // Perform a soft delete by setting isDeleted to true
      teacherToDelete.isDeleted = true;
      teacherToDelete.modifiedAt = new Date(); // Optionally update the modified date
      teacherToDelete.modifiedBy = req.user.email; // Optionally update the modifier's email
      await teacherToDelete.save();
  
      res.json({ msg: "teacher deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  });
  
router.get('/getallteachers',authenticateToken,requireRole("User"), async (req, res) => {
    try {
      const teachers = await Teachers.find({});
      res.status(200).json(teachers);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error", error: error.message });
    }
  });
  
  
  
  
  router.post('/getcoursesforteacher', authenticateToken, requireRole("User"), async (req, res) => {
    try {
      const { teacher_id } = req.body; // Assuming you're passing the teacher's ObjectId in the request
      
      if (!teacher_id) {
        return res.status(400).json({ msg: "Teacher ID is required." });
      }
  
      // Find the teacher by their ID to get the list of Course ObjectIds
      const teacher = await Teachers.findById(teacher_id);
  
      if (!teacher) {
        return res.status(404).json({ msg: "Teacher not found." });
      }
  
      // Use the CoursesTaughtIDs to find all corresponding courses
      const courses = await Courses.find({
        '_id': { $in: teacher.CoursesTaughtIDs }
      });
  
      if (!courses.length) {
        return res.status(404).json({ msg: "No courses found for this teacher." });
      }
  
      res.status(200).json(courses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error", error: error.message });
    }
  });
  
  
/**
 * Get a single teacher profile by ID
 */
router.get('/:teacherId', authenticateToken, async (req, res) => {
    // Implement logic to fetch a specific teacher profile by its ID
});

// Export the router to use in your app.js
module.exports = router;
