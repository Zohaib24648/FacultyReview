const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2');



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
      
  courseSchema.plugin(mongoosePaginate);

  module.exports = mongoose.model('Course', courseSchema);
