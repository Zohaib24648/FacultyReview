const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const loggingMiddleware = require('./middleware/loggingMiddleware'); // Import logging middleware

const app = express();
const port = 3001;

// Middleware for CORS and parsing request bodies
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the logging middleware
app.use(loggingMiddleware);

// Connect to MongoDB
mongoose.connect('mongodb+srv://Zohaib24648:Zohaib24648@userlogins.94nzbbm.mongodb.net/')
    .then(() => {
        console.log('Connected to the Database');
        app.listen(port, () => console.log(`Server is running on port ${port}`));
    })
    .catch((err) => {
        console.log('Not Connected to the Database: ' + err);
    });

// Import route modules
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');
const teacherRoutes = require('./routes/teachers');
const courseRoutes = require('./routes/courses');
const ratingRoutes = require('./routes/ratings');
const postRoutes = require('./routes/posts');

// Use route modules
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/posts', postRoutes);

// Catch-all for unhandled routes
app.use((req, res, next) => {
  res.status(404).send('Sorry, that route does not exist.');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
