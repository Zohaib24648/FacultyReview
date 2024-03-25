const mongoose = require('mongoose');
const { emailValidator, passwordValidator, erpValidator,emptyValidator } = require('../utils/validators'); // Define these validators in a separate file or inside this one

const userSchema = new mongoose.Schema({
    email: {
      type: String,
      unique:true,
      required:true,
      validate: emailValidator
      
      },
  
    password: {
      type: String,
      required:true,
      validate: passwordValidator
  
    },
  
    firstname : {
      type:String,
      required:true,
    validate: emptyValidator
    },

    lastname : {
      type:String,
      required:true,
      validate: emptyValidator
    },
   
    erp : {
      type: Number,
        required:true,
        unique:true,
        validate: erpValidator
    },
    profile_picture : {type:String,default:""},
    
    roles: {
      type: [String], 
      default: ["User"] 
    },

    saved_comments : {type:Array,
    default:[]},

    saved_teachers : {type:Array,
    default:[]},

    saved_courses : {type:Array,
    default:[]},
    isdeleted : {type:Boolean,default:false}, 
    createdby :{type:String,default:""},
    modifiedby:{type:String,default:""},
    createdat:{type:Date, default:Date.now},
    modifiedat:{type:Date, default:Date.now}
   });




  const User = mongoose.model('User', userSchema);

  module.exports = mongoose.model('User', userSchema);
