const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
router.use(express.json());
module.exports = router; // Export the router
const securitykey ="ZohaibMughal";



function decodeToken(token) {
  try {
    // Verify the token using the secret key and extract the payload
    const decoded = jwt.verify(token, securitykey);
    return decoded;
  } catch (error) {
    console.error("Error decoding token: ", error.message);
    return null;
  }
}


function authenticateToken(req, res, next) {
  // Extract the token from the Authorization header and expect a Bearer token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ msg: "Access Denied: No token provided" });
  }

  jwt.verify(token, securitykey, (err, user) => {
    if (err) {
      return res.status(403).json({ msg: "Invalid Token" });
    }
    req.user = user; // Attach the user payload to the request
    console.log('authenticated user having token ' + token);
    next(); // Proceed to the next middleware or route handler
  });
}

function requireRole(role) {
  return function(req, res, next) {
    // Assuming req.user.roles is an array of roles
    if (!req.user.roles.includes(role)) {
      return res.status(403).send({ message: `Access denied. Requires ${role} role.` });
    }
    next();
  };
}

// this will be modified to only accept emails of IBA
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
  "Courses Taught": Array,
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
    profile_picture : String,
    
    roles: {
      type: [String], 
      default: ["User"] 
    },

    saved_reviews : {type:Array,
    default:[]},

    saved_teachers : {type:Array,
    default:[]},

    saved_courses : {type:Array,
    default:[]},
    isdeleted : {type:Boolean,default:false}, 
    createdby :String,
    modifiedby:String,
    createdat:Date,
    modifiedat:Date
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
          required: true,
          validate: emptyValidator
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

      downvotes: {
          type: Number,
          default: 0
      },

      createdby :String,
      modifiedby:String,
      createdat:Date,
      modifiedat:Date,
      isDeleted:{type:Boolean,default:false}
  });
  
  const Comments = mongoose.model('Comments', commentSchema);


  router.post("/register", async (req, res) => {
  try {
    const { email, password, firstname, lastname, erp } = req.body;
    
    // Check if the email or ERP is already in use
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
      return res.status(409).json({ msg: "This email is already in use" });
    }
    
    const existingUserByErp = await User.findOne({ erp });
    if (existingUserByErp) {
      return res.status(409).json({ msg: "This ERP is already in use" });
    }
    
    // Check if the password is valid
    if (!passwordValidator.validator(password)) {
      return res.status(400).json({ 
        msg: "Password must contain at least 1 uppercase letter, 1 number, and have a length greater than 8."
      });
    }
    
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ 
      email, 
      password: hashedPassword,
      firstname,
      lastname,
      erp,
      createdby: email,
      createdat: new Date(),
      modifiedat: new Date()
    });
    
    return res.status(200).json({ msg: "Registration successful" });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ msg: "There was a validation error.", details: error.message });
    } else if (error.code === 11000) {
      return res.status(409).json({ msg: "There was a duplicate key error.", details: error.message });
    } else {
      return res.status(500).json({ msg: error.message });
    }
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
      erp: user.erp, 
      email: user.email,
      roles: user.roles,
      // firstname: user.firstname,
      // lastname: user.lastname, 
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


router.get('/logout', async (req, res) => {
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

router.patch('/changepassword',authenticateToken, requireRole("User"), async (req, res) => {
  try {
    const {erp, oldpassword, newpassword } = req.body;
   
    if (oldpassword == newpassword) {
      return res.status(400).json({ msg: "New Password cannot be same as old password" });
    }


       // Check if the password is valid
       if (!passwordValidator.validator(oldpassword)) {
        return res.status(400).json({ 
          msg: "Old Password must contain at least 1 uppercase letter, 1 number, and have a length greater than 8."
        });
  }
 
 
    // Check if the password is valid
       if (!passwordValidator.validator(newpassword)) {
        return res.status(400).json({ 
          msg: "New Password must contain at least 1 uppercase letter, 1 number, and have a length greater than 8."
        });
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
    if (error.name === 'JsonWebTokenError') {
      // Handle JWT-specific errors
      console.log(error);
      return res.status(401).json({ msg: "Invalid Token" });
    }
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});

router.get('/getuserprofile',authenticateToken, requireRole("User"),async(req,res)=>{
  
  const { erp } = req.user;
  try {
      const user = await User.findOne({ erp }, { password: 0 }); // Excluding password from the response
      if (!user) {
          return res.status(404).json({ msg: "User not found" });
      }
      res.json(user); // Respond with the user profile information
  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Internal server error" });
  }

});


router.patch('/updateProfile', authenticateToken, async (req, res) => {
  // Extract the desired updates from the request body
  const { updated_firstname, updated_lastname, updated_profile_picture } = req.body;

  try {
    // Assuming authenticateToken middleware adds the decoded token to req.user
    const erp = req.user.erp;

    // Find the user by ERP
    const user = await User.findOne({ erp });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Apply the updates if provided
    if (updated_firstname) user.firstname = updated_firstname;
    if (updated_lastname) user.lastname = updated_lastname;
    if (updated_profile_picture) user.profile_picture = updated_profile_picture;

    // Save the updated user
    await user.save();

    // Respond with a success message
    res.status(200).json({
      msg: "Profile updated successfully",
      user: { erp, email: user.email, firstname: user.firstname, lastname: user.lastname, profile_picture: user.profile_picture }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});






    router.post('/postcomment',authenticateToken,requireRole("User"), async (req, res) => {
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
  
  router.post('/getcommentteacherandcourse',authenticateToken,requireRole("User"), async (req, res) => {
    try {
        const { teacher_id, course_id } = req.body;
        const comments = await Comments.find({ teacher_id, course_id });
        res.json(comments);
    } catch(error) {
        console.error(error);
        res.status(500).json({ msg: "Internal server error" });
    }
} );


router.post('/getcommentteacher',authenticateToken,requireRole("User"), async (req, res) => {
  try {
      const { teacher_id } = req.body;
      const comments = await Comments.find({ teacher_id});
      res.json(comments);
  } catch(error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
  }
} );


router.post('/getcommentcourse',authenticateToken,requireRole("User"), async (req, res) => {
  try {
      const { course_id } = req.body;
      const comments = await Comments.find({  course_id });
      res.json(comments);
  } catch(error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
  }
} );


router.delete('/deletecomment',authenticateToken,requireRole("User"), async (req, res) => {
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



router.get('/getteachers',authenticateToken,requireRole("User"), async (req, res) => {
  try {
    const teachers = await Teachers.find({});
    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});

// // For courses Define a schema in the databse 
// router.get('/getteachers',authenticateToken,requireRole("User"), async (req, res) => {
//   try {
//     const teachers = await Teachers.find({});
//     res.status(200).json(teachers);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ msg: "Internal server error", error: error.message });
//   }
// });



router.get('/getteachercourse',authenticateToken,requireRole("User"), async (req, res) => {
  try {
    const {course_id}= req.body;
    const teachers = await Teachers.find({course_id});
    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});



router.post('/createTeacher',authenticateToken,requireRole("Moderator"), async (req, res) => {
  try {
    const { Name, Title, Email, Overview, CoursesTaught, Department, Specialization, OnboardStatus, ImageFile } = req.body;
    const newTeacher = await Teachers.create({ Name, Title, Email, Overview, CoursesTaught, Department, Specialization, OnboardStatus, ImageFile });
    res.json({ msg: "Teacher created successfully", teacher: newTeacher });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});
