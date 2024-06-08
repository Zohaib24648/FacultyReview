const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');
const Post = require('../models/Post');

// Create a new post
// Create a new post
router.post('/createpost', authenticateToken, requireRole("User"), async (req, res) => {
    try {
        const { title, content, visibility, anonymous } = req.body;
        const newPost = await Post.create({
            title,
            content,
            createdBy: req.user._id,
            visibility,
            anonymous: anonymous || false,
        });

        // Populate the createdBy field to include user details
        const populatedPost = await Post.findById(newPost._id).populate({
            path: 'createdBy',
            select: 'firstname lastname -_id'
        }).lean();

        // Return the newly created and populated post object
        res.status(201).json({ message: "Post created successfully", post: populatedPost });
    } catch (error) {
        res.status(500).json({ message: "Error creating post", error: error.message });
    }
});


// Update an existing post
router.patch('/updatepost', authenticateToken, requireRole("User"), async (req, res) => {
    try {
        const { postId, title, content, visibility } = req.body;
        const postToUpdate = await Post.findById(postId);
        if (!postToUpdate) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (postToUpdate.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes('Admin')) {
            return res.status(403).json({ message: "Not authorized to update this post" });
        }
        postToUpdate.title = title || postToUpdate.title;
        postToUpdate.content = content || postToUpdate.content;
        postToUpdate.visibility = visibility || postToUpdate.visibility;
        await postToUpdate.save();
        res.json({ message: "Post updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating post", error: error.message });
    }
});

// Delete a post
router.delete('/deletepost', authenticateToken, requireRole("User", "Admin"), async (req, res) => {
    try {
        const { postId } = req.body;
        const postToDelete = await Post.findById(postId);
        if (!postToDelete) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (postToDelete.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes('Admin')) {
            return res.status(403).json({ message: "Not authorized to delete this post" });
        }
        postToDelete.isDeleted = true;
        await postToDelete.save();
        res.json({ message: "Post deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting post", error: error.message });
    }
});

// Upvote a post
router.post('/upvotepost', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.body;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.upvotedBy.includes(req.user._id)) {
            return res.status(400).json({ message: "You have already upvoted this post" });
        }
        post.upvotes++;
        post.upvotedBy.push(req.user._id);
        await post.save();
        res.json({ message: "Post upvoted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error upvoting post", error: error.message });
    }
});

// Downvote a post
router.post('/downvotepost', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.body;
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        if (post.downvotedBy.includes(req.user._id)) {
            return res.status(400).json({ message: "You have already downvoted this post" });
        }
        post.downvotes++;
        post.downvotedBy.push(req.user._id);
        await post.save();
        res.json({ message: "Post downvoted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error downvoting post", error: error.message });
    }
});
// src/routes/posts.js

// Get all posts
router.get('/getposts', authenticateToken, async (req, res) => {
    try {
        // Fetch all non-deleted posts and populate the createdBy field
        let posts = await Post.find({ isDeleted: false })
                              .populate({
                                  path: 'createdBy',
                                  select: 'firstname lastname -_id'
                              })
                              .lean(); // Convert the Mongoose documents to plain JavaScript objects

        // Map through the posts and set createdBy to 'Anonymous' if anonymous is true
        posts = posts.map(post => {
            if (post.anonymous) {
                post.createdBy = 'Anonymous';
            } else if (typeof post.createdBy === 'object' && post.createdBy !== null) {
                // Combine the firstname and lastname if not anonymous
                post.createdBy = `${post.createdBy.firstname} ${post.createdBy.lastname}`;
            } 
            // If createdBy is not an object, it remains as it is (string case)
            return post;
        });

        // Send the modified posts as the response
        res.status(200).json(posts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching posts", error: error.message });
    }
});

router.post('/getpostbyid', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.body;
        const post = await Post.findById(postId)
                               .populate({
                                   path: 'createdBy',
                                   select: 'firstname lastname -_id'
                               })
                               .populate({
                                   path: 'comments',
                                   populate: {
                                       path: 'createdby',
                                       select: 'firstname lastname -_id'
                                   }
                               })
                               .lean();

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Format post createdBy field
        if (post.anonymous) {
            post.createdBy = 'Anonymous';
        } else {
            post.createdBy = `${post.createdBy.firstname} ${post.createdBy.lastname}`;
        }

        // Format comments to handle anonymity and ensure 'createdAt' field is provided
        post.comments = post.comments.map(comment => ({
            ...comment,
            name: comment.anonymous ? 'Anonymous' : comment.name,
            createdAt: comment.createdat ? new Date(comment.createdat).toISOString() : 'No Date Provided'
        }));

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: "Error fetching post", error: error.message });
    }
});

module.exports = router;
