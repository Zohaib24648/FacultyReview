const mongoose = require('mongoose');
const { emailValidator, passwordValidator, erpValidator } = require('../utils/validators'); // Define these validators in a separate file or inside this one
const Schema = mongoose.Schema;



const teacherSchema = new mongoose.Schema({
    Name: String,
    Title: String,
    Email: String,
    Overview: String,
    CoursesTaught: [String],
    CoursesTaughtIDs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],
    Department: String,
    Specialization: String,
    OnboardStatus: String,
    ImageFile: String,
    createdBy: String,
    modifiedBy: String,
    createdAt: Date,
    modifiedAt: Date,
    isDeleted: { type: Boolean, default: false }
  });
  
  
  // Create a model for your collection
  const Teachers = mongoose.model('Teachers', teacherSchema);
  
  module.exports = mongoose.model('Teacher', teacherSchema);
