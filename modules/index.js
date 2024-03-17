const express = require('express');
const router = express.Router();

// Import other routers
const authRouter = require('./auth');

// Use the imported routers, mounting them on their respective base paths
router.use('/auth', authRouter);

// Export the configured router to be used in the main app
module.exports = router;
