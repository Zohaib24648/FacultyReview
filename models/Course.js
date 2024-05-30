const mongoose = require('mongoose');
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
      
  module.exports = mongoose.model('Course', courseSchema);
