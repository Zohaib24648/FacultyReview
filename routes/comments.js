const express = require('express');
const router = express.Router();

// Import required middleware
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');

// requireRole might not be needed if you don't have role-based restrictions for comments

// Import the Comment model
const Comments = require('../models/Comment');


router.post('/postcomment', authenticateToken, requireRole("User"), async (req, res) => {
    try {
      const { teacher_id, comment, rating, course_id, anonymous, parent_id} = req.body;
      // Concatenate name only if not posting anonymously
  
      const name = req.user.firstname + " " + req.user.lastname;
      const email = req.user.email;
      const erp = req.user.erp;
      const newComment = await Comments.create({
        teacher_id,
        comment,
        rating,
        course_id,
        anonymous,
        erp,
        parent_id: parent_id || null, // Explicitly set to null if parent_id is not provided
        name,
        createdby: email, // Assuming 'createdby' is meant to track who created the comment
        createdat: new Date(),
        modifiedat: new Date(),
        modifiedby: email
      });
  
      // Access the _id from the newly created comment
      const objectId = newComment._id;
  
      res.json({ msg: "Comment Posted Successfully", objectId });
  
      // Print the ObjectId
      console.log("New comment created with ObjectId:", objectId);
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  });
  
  
  
  router.patch('/updatecomment', authenticateToken, requireRole("User"), async (req, res) => {
    try {
      const { commentId, newComment, newAnonymousStatus } = req.body;
      
      const commentToUpdate = await Comments.findById(commentId);
      if (!commentToUpdate) {
        return res.status(404).json({ msg: "Comment not found" });
      }
  
      const isAuthor = commentToUpdate.erp === req.user.erp;
      const isAdminOrModerator = req.user.roles.includes('Admin') || req.user.roles.includes('Moderator');
  
      if (!isAuthor && !isAdminOrModerator) {
        return res.status(403).json({ msg: "Not authorized to update this comment" });
      }
  
      // Apply updates only for the fields that were actually provided in the request
      if (typeof newComment !== 'undefined') {
        commentToUpdate.comment = newComment;
      }
      if (typeof newAnonymousStatus !== 'undefined') {
        commentToUpdate.anonymous = newAnonymousStatus;
      }
  
      commentToUpdate.modifiedat = new Date();
      commentToUpdate.modifiedby = req.user.email;
  
      await commentToUpdate.save();
  
      res.json({ msg: "Comment updated successfully" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error", error: error.message });
    }
  });
  
  
  
  
  router.delete('/deletecomment', authenticateToken, async (req, res) => {
    try {
      const { objectId } = req.body;
      const commentToDelete = await Comments.findById(objectId);
  
      if (!commentToDelete) {
        return res.status(404).json({ msg: "Comment not found" });
      }
  
      // Check if the user is an Admin/Moderator or if the ERP matches
      const hasPermission = req.user.roles.includes('Admin') || 
                            req.user.roles.includes('Moderator') || 
                            commentToDelete.erp === req.user.erp;
  
      if (!hasPermission) {
        return res.status(403).json({ msg: "Not authorized to delete this comment" });
      }
  
      // Perform a soft delete by setting isDeleted to true
      commentToDelete.isDeleted = true;
      commentToDelete.modifiedat = new Date(); // Optionally update the modified date
      commentToDelete.modifiedby = req.user.email; // Optionally update the modifier's email
      await commentToDelete.save();
  
      res.json({ msg: "Comment deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
    }
  });
  
router.post('/getcommentsofteacher', authenticateToken, requireRole("User"), async (req, res) => {
    try {
        const { teacher_id } = req.body;
        
        // Input validation
        if (!teacher_id) {
            return res.status(400).json({ msg: "Teacher ID is required." });
        }
        
        // Ensuring teacher_id is of expected type/format, if necessary
        // For example, checking if teacher_id is a number:
        if (isNaN(teacher_id)) {
            return res.status(400).json({ msg: "Invalid Teacher ID format." });
        }
  
        const comments = await Comments.find({ teacher_id });
        
        // Handling no comments found
        if (comments.length === 0) {
            return res.status(404).json({ msg: "No comments found for the specified teacher." });
        }
  
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        // Providing more specific error messages could be useful here, 
        // but ensure not to disclose sensitive system information
        res.status(500).json({ msg: "Internal server error", error: error.toString() });
    }
  });
  
  
  router.post('/getcommentsofcourse', authenticateToken, requireRole("User"), async (req, res) => {
    try {
        const { course_id } = req.body;
  
        // Input validation
        if (!course_id) {
            return res.status(400).json({ msg: "Course ID is required" });
        }
  
        // Optionally, further validate course_id format or existence in the database before querying comments
  
        const comments = await Comments.find({ course_id });
  
        // Handle case where no comments are found for the specified course
        if (!comments.length) {
            return res.status(404).json({ msg: "No comments found for the specified course" });
        }
  
        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
  });
  
  
  router.post('/getcommentsforteacherandcourse', authenticateToken, requireRole("User"), async (req, res) => {
    try {
        const { teacher_id, course_id } = req.body;
  
        // Input validation for teacher_id
        if (!teacher_id) {
            return res.status(400).json({ msg: "Teacher ID is required." });
        }
        
        if (isNaN(teacher_id)) {
            return res.status(400).json({ msg: "Invalid Teacher ID format." });
        }
  
        // Input validation for course_id
        if (!course_id) {
            return res.status(400).json({ msg: "Course ID is required." });
        }
  
        if (isNaN(course_id)) {
            return res.status(400).json({ msg: "Invalid Course ID format." });
        }
  
        const comments = await Comments.find({ teacher_id, course_id });
        
        // Handling no comments found
        if (comments.length === 0) {
            return res.status(404).json({ msg: "No comments found for the specified teacher and course." });
        }
  
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error", error: error.toString() });
    }
  });
  
// Export the router to use in your app.js
module.exports = router;
