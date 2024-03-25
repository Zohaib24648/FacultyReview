const mongoose = require('mongoose');
const { emailValidator, passwordValidator,emptyValidator, erpValidator } = require('../utils/validators'); // Define these validators in a separate file or inside this one
const Schema = mongoose.Schema;



const commentSchema = new mongoose.Schema({
    erp: {
        type: Number,
        required: true,
        erpValidator
    },
    name: {
        type: String,
        required: true,
        validate: emptyValidator
    },

    parent_id:{
      type:Number,
      default :null
    },

    comment: {
        type: String,
    //     required: true,
    //     validate: emptyValidator
},

    rating: {
        type: Array,
    },

    anonymous: {
        type: Boolean,
        required: true
    },

    teacher_id: {
        type: Number,
        required: true
    },

    course_id: {
        type: Number,
        required: true
    },

    upvotes: {
        type: Number,
        default: 0
    },
    upvotedBy: [{ type: Number }],
    downvotedBy: [{ type: Number }],

    downvotes: {
        type: Number,
        default: 0
    },

    createdby :{type: String, default:""},
    modifiedby:{type: String, default:""},
    createdat:{type:Date, default:Date.now},
    modifiedat:{type:Date, default:Date.now},
    isDeleted:{type:Boolean,default:false}
});

const Comments = mongoose.model('Comments', commentSchema);

module.exports = mongoose.model('Comment', commentSchema);
