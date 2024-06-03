const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');
const Comments = require('../models/Comment');
const mongoose = require('mongoose');
const Post = require ('../models/Post')

function logBodies(req, res, next) {
    console.log('Request Body:', req.body);

    // Override the res.json method to log response body
    const originalJson = res.json;
    res.json = function (body) {
        console.log('Response Body:', body);
        originalJson.call(this, body);
    };

    next();
}

router.post('/postcomment', authenticateToken, requireRole("User"),logBodies, async (req, res) => {
  const { teacher_id, comment, course_id, anonymous, parent_id } = req.body;
  const name = req.user.firstname + " " + req.user.lastname;
  const erp = req.user.erp;

  try {
      const newComment = await Comments.create({
          teacher_id,
          comment,
          course_id: course_id || null, // Default to null if course_id is not provided
          anonymous,
          erp,
          parent_id,
          name,
          createdby: req.user.email,
          createdat: new Date(),
          modifiedat: new Date(),
          modifiedby: req.user.email
      });

      res.json({ msg: "Comment Posted Successfully", objectId: newComment._id });
  } catch (error) {
      res.status(500).json({ msg: "Internal server error", error: error.message });
      console.log(error.message);
  }
});
router.post('/postCommentOnPost', authenticateToken, requireRole("User"),logBodies, async (req, res) => {
    console.log(req.body);
    const { post_id, commentText, anonymous } = req.body;
  
    // Validate post_id
    if (!mongoose.Types.ObjectId.isValid(post_id)) {
      return res.status(400).json({ msg: "Invalid post ID format." });
    }
  
    try {
      // Create the comment
      const newComment = await Comments.create({
        erp: req.user.erp, // Assuming 'erp' is available in req.user
        name: req.user.firstname + " " + req.user.lastname,
        comment: commentText,
        anonymous: anonymous,
        createdby: req.user.email,
        modifiedby: req.user.email,
        createdat: new Date(),
        modifiedat: new Date(),
        // No need to include teacher_id or course_id unless explicitly needed
      });
  
      // Update the post to include the new comment's ID
      await Post.findByIdAndUpdate(post_id, {
        $push: { comments: newComment._id },
        $set: { modifiedAt: new Date() }
      });
  
      res.status(201).json({ msg: "Comment posted successfully", commentId: newComment._id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error", error: error.message });
    }
  });


router.patch('/updatecomment', authenticateToken, requireRole("User"), logBodies,async (req, res) => {
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

router.delete('/deletecomment', authenticateToken, logBodies,async (req, res) => {
    try {
        const { objectId } = req.body;
        const commentToDelete = await Comments.findById(objectId);

        if (!commentToDelete) {
            return res.status(404).json({ msg: "Comment not found" });
        }

        const hasPermission = req.user.roles.includes('Admin') || 
                              req.user.roles.includes('Moderator') || 
                              commentToDelete.erp === req.user.erp;

        if (!hasPermission) {
            return res.status(403).json({ msg: "Not authorized to delete this comment" });
        }

        commentToDelete.isDeleted = true;
        commentToDelete.modifiedat = new Date();
        commentToDelete.modifiedby = req.user.email;
        await commentToDelete.save();

        res.json({ msg: "Comment deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});

router.post('/getcommentsofteacher', authenticateToken, requireRole("User"),logBodies, async (req, res) => {
  try {
      const { teacher_id } = req.body;

      if (!teacher_id) {
          return res.status(400).json({ msg: "Teacher ID is required." });
      }

      if (!mongoose.Types.ObjectId.isValid(teacher_id)) {
          return res.status(400).json({ msg: "Invalid Teacher ID format." });
      }

      const comments = await Comments.find({ teacher_id });

      if (comments.length === 0) {
          return res.status(404).json({ msg: "No comments found for the specified teacher." });
      }

      res.status(200).json(comments);
  } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error", error: error.toString() });
  }
});

router.post('/getcommentsofcourse', authenticateToken, requireRole("User"),logBodies, async (req, res) => {
    try {
        const { course_id } = req.body;

        if (!course_id) {
            return res.status(400).json({ msg: "Course ID is required" });
        }

        const comments = await Comments.find({ course_id });

        if (!comments.length) {
            return res.status(404).json({ msg: "No comments found for the specified course" });
        }

        res.json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
});

router.post('/getcommentsforteacherandcourse', authenticateToken, requireRole("User"),logBodies, async (req, res) => {
    try {
        const { teacher_id, course_id } = req.body;

        if (!teacher_id) {
            return res.status(400).json({ msg: "Teacher ID is required." });
        }

        if (isNaN(teacher_id)) {
            return res.status(400).json({ msg: "Invalid Teacher ID format." });
        }

        if (!course_id) {
            return res.status(400).json({ msg: "Course ID is required." });
        }

        if (isNaN(course_id)) {
            return res.status(400).json({ msg: "Invalid Course ID format." });
        }

        const comments = await Comments.find({ teacher_id, course_id });

        if (comments.length === 0) {
            return res.status(404).json({ msg: "No comments found for the specified teacher and course." });
        }

        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error", error: error.toString() });
    }
});


router.post('/postCommentOnPost', authenticateToken, requireRole("User"),logBodies, async (req, res) => {
  const { post_id, commentText, anonymous } = req.body;

  if (!mongoose.Types.ObjectId.isValid(post_id)) {
    return res.status(400).json({ msg: "Invalid post ID format." });
  }

  try {
    // Create the comment using the Comment model structure
    const newComment = await Comments.create({
      erp: req.user.erp,
      name: req.user.firstname + " " + req.user.lastname,
      comment: commentText,
      anonymous: anonymous,
      createdby: req.user.email,
      modifiedby: req.user.email,
      createdat: new Date(),
      modifiedat: new Date(),
      teacher_id: null,
      course_id: null,
    });

    // Update the post to include the new comment's ID
    await Post.findByIdAndUpdate(post_id, {
      $push: { comments: newComment._id },
      $set: { modifiedAt: new Date() }
    });

    res.status(201).json({ msg: "Comment posted successfully", commentId: newComment._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});

// Route to get a comment by ID
router.post('/getcommentbyid', authenticateToken, requireRole("User"),logBodies, async (req, res) => {
  const { commentId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ msg: "Invalid comment ID format." });
  }

  try {
    const comment = await Comments.findById(commentId);
    if (!comment) {
      return res.status(404).json({ msg: "Comment not found." });
    }
    res.status(200).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});

module.exports = router;

