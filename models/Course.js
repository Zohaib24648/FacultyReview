const mongoose = require('mongoose');
const { emailValidator, passwordValidator, erpValidator } = require('../utils/validators'); // Define these validators in a separate file or inside this one
const Schema = mongoose.Schema;



const courseSchema = new Schema({
    Course_name: {
      type: String,
      required: true
    },
    "Course Description": {
      type: String,
      required: true
    },
    Teachers: [{
      type: Schema.Types.ObjectId, // Corrected reference to ObjectId
      ref: 'Teacher' // Ensure 'Teacher' matches the name of your teacher model
    }]
  });
  
  const Courses = mongoose.model('Courses', courseSchema);
    
  module.exports = mongoose.model('Course', courseSchema);
