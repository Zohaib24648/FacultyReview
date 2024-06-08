const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const requireRole = require('../middleware/requireRole');
const Post = require('../models/Post'); // Ensure this points to your Post model
const asyncHandler = require('../middleware/loggingMiddleware')


// Create a new post
router.post('/createpost', authenticateToken, requireRole("User"), asyncHandler(async (req, res) => {
    const { title, content, tags, visibility, attachments,anonymous } = req.body;
    const newPost = await Post.create({
        title,
        content,
        createdBy: req.user._id,
        // tags,
        visibility,
        anonymous: anonymous || false,
        attachments
    });
    res.status(201).json({ message: "Post created successfully", postId: newPost._id });
}));

// Update an existing post
router.patch('/updatepost', authenticateToken, requireRole("User"), asyncHandler(async (req, res) => {
    const { postId, title, content, tags, visibility, attachments } = req.body;
    const postToUpdate = await Post.findById(postId);
    if (!postToUpdate) {
        return res.status(404).json({ message: "Post not found" });
    }
    if (postToUpdate.createdBy.toString() !== req.user._id.toString() && !req.user.roles.includes('Admin')) {
        return res.status(403).json({ message: "Not authorized to update this post" });
    }
    postToUpdate.title = title || postToUpdate.title;
    postToUpdate.content = content || postToUpdate.content;
    postToUpdate.tags = tags || postToUpdate.tags;
    postToUpdate.visibility = visibility || postToUpdate.visibility;
    postToUpdate.attachments = attachments || postToUpdate.attachments;
    await postToUpdate.save();
    res.json({ message: "Post updated successfully" });
}));

// Delete a post
router.delete('/deletepost', authenticateToken, requireRole("User", "Admin"), asyncHandler(async (req, res) => {
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
}));

// Upvote a post
router.post('/upvotepost', authenticateToken, asyncHandler(async (req, res) => {
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
}));

// Downvote a post
router.post('/downvotepost', authenticateToken, asyncHandler(async (req, res) => {
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
}));

router.get('/getposts', authenticateToken, asyncHandler(async (req, res) => {
    let posts = await Post.find({ isDeleted: false })
                            .populate({
                                path: 'createdBy',
                                select: 'firstname lastname -_id' // Removed the anonymous field as it's not part of the user
                            })
                            .lean(); // Converts the Mongoose document to a plain JavaScript object

    posts = posts.map(post => {
        console.log("Checking anonymity for: ", post.anonymous); // Log the anonymous status from the post, not the user

        // Check if the post is marked as anonymous
        if (post.anonymous) {
            console.log("Post is anonymous, setting createdBy to 'Anonymous'");
            post.createdBy = 'Anonymous';
        } else {
            console.log("Post is not anonymous, setting createdBy to full name");
            // Combine first name and last name if not anonymous
            post.createdBy = `${post.createdBy.firstname} ${post.createdBy.lastname}`;
        }
        console.log("Final createdBy value: ", post.createdBy);
        return post;
    });

    res.status(200).json(posts);
}));



router.post('/getpostbyid', authenticateToken, asyncHandler(async (req, res) => {
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

    // Check the anonymous field directly on the post document
    if (post.anonymous) {
        post.createdBy = 'Anonymous';
    } else {
        post.createdBy = `${post.createdBy.firstname} ${post.createdBy.lastname}`;
    }

    // Process comments to handle anonymity
    post.comments = post.comments.map(comment => {
        if (comment.anonymous) {
            comment.name = 'Anonymous';
        }
        return comment;
    });

    res.json(post);
}));


module.exports = router;
