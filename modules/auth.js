const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
router.use(express.json());
module.exports = router; // Export the router
const Schema = mongoose.Schema;


const securitykey ="ZohaibMughal";

const emailValidator = {
    validator: function(value) {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        if (!isValid) {
        throw new Error("The email is not valid. Please enter a valid email address.");
      }
      return isValid;
    },
  };


  const passwordValidator = {
    validator: function(value) {
      // Regular expression for password validation
      const isvalid = /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);
    //   if (!isvalid) {throw new Error("Password must contain at least 1 uppercase letter, 1 number, and have a length greater than 8.");
    // }
      return isvalid;
    },
  };

  const emptyValidator ={
    validator: function(value) {
        return value.length > 0;
    },
    message: "Value Cannot be Empty"
}


const erpValidator ={
    
        validator: function(value) {
            return value.toString().length === 5;
        },
        message: "ERP number must be exactly 5 digits long."
    
}

const teacherSchema = new mongoose.Schema({
  "Name": String,
  "Title": String,
  "Email": String,
  "Overview": String,
  "Courses Taught": String,
  "Department": String,
  "Specialization": String,
  "Onboard Status": String,
  "ImageFile": String
});

// Create a model for your collection
const Teachers = mongoose.model('Teachers', teacherSchema);

  // Define a User model
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
    
    roles : {type:String,
    default:"User"}


  });
  const User = mongoose.model('User', userSchema);



      // comment_id: {
    //   type: Number,
    //   required:true,
    //   unique:true,
    //   },

    const commentSchema = new mongoose.Schema({
      erp: {
          type: Number,
          required: true,
          erpValidator
      },

      parent_id:{
        type:Number,
        default :null
      },

      comment: {
          type: String,
          required: true,
          validate: emptyValidator
      },
      rating: {
          type: Array,
          required: true,
          validate: emptyValidator
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
      }
  });
  
  const Comments = mongoose.model('Comments', commentSchema);


  const teachers = mongoose.model('Teachers');

  router.post("/register", async (req, res) => {
    try {
      const { email, password,firstname,lastname, erp } = req.body;
      
      // Check if the email is already in use
      let user = await User.findOne({ email });
      if (user) return res.status(409).json({ msg: "This email is already in use" });
      
      let user1 = await User.findOne({ erp });
      if (user1) return res.status(409).json({ msg: "This ERP is already in use" });
      
      // Check if the password is valid
      if (passwordValidator.validator(password)) {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create a new user in database and respond
      await User.create({ email, password: hashedPassword,firstname,lastname,erp});
      return res.status(200).json({ msg: "Successful" });
    }
      else{
        res.status(400).json({ 
          msg: "Password must contain at least 1 uppercase letter, 1 number, and have a length greater than 8."
      });
              }}
      
      catch (error) {
      // If the error is a validation error(MongoDB), respond with a 400 status code
      
        console.error(error);
        return res.status(500).json({ msg: error.message });
      }
    });




    
    router.post("/login", async (req, res) => {
      try {
        const { loginUsername, password } = req.body;
    
        // Determine if the loginUsername is an ERP or an email
        let user;
        if (loginUsername.includes('@')) {
          // If loginUsername contains '@', treat it as an email
          user = await User.findOne({ email: loginUsername });
        } else {
          // Otherwise, treat it as an ERP
          user = await User.findOne({ erp: loginUsername });
        }
    
        if (!user) {
          return res.status(404).json({ msg: "This ERP or Email is not linked to any account" });
        }
    
        const passwordCheck = await bcrypt.compare(password, user.password);
        if (!passwordCheck) {
          return res.status(401).json({ msg: "Incorrect Password" }); // 401 Unauthorized for wrong credentials
        }
    
        // Use a unique identifier for JWT; could be user's id, email, or a combination
        const token = jwt.sign({
          id: user.erp, 
          email: user.email, 
          createdAt: new Date(),
        }, securitykey, { expiresIn: "1d" });
    
        res.json({
          msg: "LOGGED IN",
          token
        });
      } catch (error) {
        console.log(error)
        return res.status(500).json({ msg: "INTERNAL SERVER ERROR" }); // Ensure consistent error format
      }
    });
  

    router.post('/logout', async (req, res) => {
      try {
        // Invalidate token by removing it from the client-side storage
        res.clearCookie('token');
        // Optionally, set a very short expiry for the cookie to ensure it gets deleted
        res.status(200).json({ msg: 'Logged out successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Internal server error' });
      }
    });
    
    router.patch('/changepassword', async (req, res) => {
      try {
        const { erp, oldpassword, newpassword } = req.body;
        if(oldpassword==newpassword){
          return res.status(400).json({ msg: "New Password cannot be same as old password" });
        }
        // Attempt to find the user by ERP
        const user = await User.findOne({ erp });
        if (!user) {
          return res.status(404).json({ msg: "User not found" });
        }
    
        // Check that the old password matches
        const passwordCheck = await bcrypt.compare(oldpassword, user.password);
        if (!passwordCheck) {
          return res.status(401).json({ msg: "Incorrect Password" }); // Unauthorized for wrong credentials
        }
    
        // Hash the new password before saving
        const hashedNewPassword = await bcrypt.hash(newpassword, 10); // Assuming a salt round of 10, adjust as needed
        user.password = hashedNewPassword;
        await user.save();
    
        res.status(200).json({ msg: "Password Changed Successfully" });
      } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
      }
    });



    router.post('/postcomment', async (req, res) => {
      try {
          const { teacher_id, comment, rating, course_id, anonymous, erp } = req.body;
          const newComment = await Comments.create({ teacher_id, comment, rating, course_id, anonymous, erp });
          
          // Access the _id from the newly created comment
          const objectId = newComment._id;
  
          res.json({ msg: "Comment Posted Successfully", objectId });
  
          // Print the ObjectId
          console.log("New comment created with ObjectId:", objectId);
      } catch(error) {
          console.error(error);
          res.status(500).json({ msg: "Internal server error" });
      }
  });
  



    router.post('/postreply', async (req, res) => {
      try {
          const { teacher_id, comment, rating, course_id, anonymous, erp, parent_id } = req.body;
          const newComment = await Comments.create({ teacher_id, comment, rating, course_id, anonymous, erp, parent_id });
          
          // Access the _id from the newly created comment
          const objectId = newComment._id;
  
          res.json({ msg: "Comment Posted Successfully", objectId });
  
          // Print the ObjectId
          console.log("New comment created with ObjectId:", objectId);
      } catch(error) {
          console.error(error);
          res.status(500).json({ msg: "Internal server error" });
      }
  });
  
  router.post('/getcommentteacherandcourse', async (req, res) => {
    try {
        const { teacher_id, course_id } = req.body;
        const comments = await Comments.find({ teacher_id, course_id });
        res.json(comments);
    } catch(error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
} );


router.post('/getcommentteacher', async (req, res) => {
  try {
      const { teacher_id } = req.body;
      const comments = await Comments.find({ teacher_id});
      res.json(comments);
  } catch(error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
  }
} );


router.post('/getcommentcourse', async (req, res) => {
  try {
      const { course_id } = req.body;
      const comments = await Comments.find({  course_id });
      res.json(comments);
  } catch(error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
  }
} );


router.delete('/deletecomment', async (req, res) => {
  try {
      const { objectId } = req.body;
      const deletedComment = await Comments.findByIdAndDelete(objectId);
      if (!deletedComment) {
          return res.status(404).json({ msg: "Comment not found" });
      }
      res.json({msg:"Deleted Successfully"});
  } catch(error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
  }
}
);


router.post('/getuserprofile',async(req,res)=>{
  try{
    const { erp } = req.body;
    const user = await User.findOne({ erp },{ password: 0 });
    if(!user){
      return res.status(404).json({msg:"User not found"});
    }
    res.json(user);
  }catch(err){
    console.error(err);
    res.status(500).json({ msg: "Internal server error" });
  }
});

router.get('/getteachers', async (req, res) => {
  try {
    const teachers = await Teachers.find({});
    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});

// For courses Define a schema in the databse 
router.get('/getteachers', async (req, res) => {
  try {
    const teachers = await Teachers.find({});
    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});



router.get('/getteachercourse', async (req, res) => {
  try {
    const {course_id}= req.body;
    const teachers = await Teachers.find({course_id});
    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});



router.post('/createTeacher', async (req, res) => {
  try {
    const { Name, Title, Email, Overview, CoursesTaught, Department, Specialization, OnboardStatus, ImageFile } = req.body;
    const newTeacher = await Teachers.create({ Name, Title, Email, Overview, CoursesTaught, Department, Specialization, OnboardStatus, ImageFile });
    res.json({ msg: "Teacher created successfully", teacher: newTeacher });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});
