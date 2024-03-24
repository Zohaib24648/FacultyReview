const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
router.use(express.json());
module.exports = router; // Export the router
const securitykey ="ZohaibMughal";
const Schema = mongoose.Schema;



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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ msg: "Access Denied: No token provided" });
  }

  jwt.verify(token, securitykey, (err, decoded) => {
    if (err) {
      return res.status(403).json({ msg: "Invalid Token" });
    }
    console.log('Decoded token payload:', decoded);
    req.user = decoded; // Attach the decoded payload to req.user
    next();
  });
}


async function verifyUserExists(req, res, next) {
  try {
    const erp = req.user.erp; // Extract ERP from req.user set by authenticateToken
    const userExists = await User.findOne({ erp }); // Added missing await

    if (!userExists) {
      return res.status(404).json({ msg: "User not found with erp: " + erp });
    }

    req.userDetails = userExists; // Attach the user details to req.userDetails
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
}



 function requireRole(role) {
  return function(req, res, next) {
    // Assuming req.user.roles is an array of roles
    console.log(req.user.roles);
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

    saved_comments : {type:Array,
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
      upvotedBy: [{ type: Number }],
      downvotedBy: [{ type: Number }],

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
      firstname: user.firstname,
      lastname: user.lastname, 
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
    const {oldpassword, newpassword } = req.body;
    const{erp}=req.user;
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
      return res.status(404).json({ msg: "User not found with erp: " + erp });
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






router.post('/postcomment', authenticateToken, requireRole("User"), async (req, res) => {
  try {
    const { teacher_id, comment, rating, course_id, anonymous, parent_id} = req.body;
    // Concatenate name only if not posting anonymously

    const name = req.user.firstname + " " + req.user.lastname;
    const email = req.user.email;
    const erp = req.user.erp;
    const newComment = await Comments.create({
      teacher_id,
      comment,
      rating,
      course_id,
      anonymous,
      erp,
      parent_id: parent_id || null, // Explicitly set to null if parent_id is not provided
      name,
      createdby: email, // Assuming 'createdby' is meant to track who created the comment
      createdat: new Date(),
      modifiedat: new Date(),
      modifiedby: email
    });

    // Access the _id from the newly created comment
    const objectId = newComment._id;

    res.json({ msg: "Comment Posted Successfully", objectId });

    // Print the ObjectId
    console.log("New comment created with ObjectId:", objectId);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});



router.patch('/updatecomment', authenticateToken, requireRole("User"), async (req, res) => {
  try {
    const { commentId, newComment, newAnonymousStatus } = req.body;
    
    const commentToUpdate = await Comments.findById(commentId);
    if (!commentToUpdate) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    const isAuthor = commentToUpdate.erp === req.user.erp;
    const isAdminOrModerator = req.user.roles.includes('Admin') || req.user.roles.includes('Moderator');

    if (!isAuthor && !isAdminOrModerator) {
      return res.status(403).json({ msg: "Not authorized to update this comment" });
    }

    // Apply updates only for the fields that were actually provided in the request
    if (typeof newComment !== 'undefined') {
      commentToUpdate.comment = newComment;
    }
    if (typeof newAnonymousStatus !== 'undefined') {
      commentToUpdate.anonymous = newAnonymousStatus;
    }

    commentToUpdate.modifiedat = new Date();
    commentToUpdate.modifiedby = req.user.email;

    await commentToUpdate.save();

    res.json({ msg: "Comment updated successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});




router.delete('/deletecomment', authenticateToken, async (req, res) => {
  try {
    const { objectId } = req.body;
    const commentToDelete = await Comments.findById(objectId);

    if (!commentToDelete) {
      return res.status(404).json({ msg: "Comment not found" });
    }

    // Check if the user is an Admin/Moderator or if the ERP matches
    const hasPermission = req.user.roles.includes('Admin') || 
                          req.user.roles.includes('Moderator') || 
                          commentToDelete.erp === req.user.erp;

    if (!hasPermission) {
      return res.status(403).json({ msg: "Not authorized to delete this comment" });
    }

    // Perform a soft delete by setting isDeleted to true
    commentToDelete.isDeleted = true;
    commentToDelete.modifiedat = new Date(); // Optionally update the modified date
    commentToDelete.modifiedby = req.user.email; // Optionally update the modifier's email
    await commentToDelete.save();

    res.json({ msg: "Comment deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});






router.post('/getcommentsofteacher', authenticateToken, requireRole("User"), async (req, res) => {
  try {
      const { teacher_id } = req.body;
      
      // Input validation
      if (!teacher_id) {
          return res.status(400).json({ msg: "Teacher ID is required." });
      }
      
      // Ensuring teacher_id is of expected type/format, if necessary
      // For example, checking if teacher_id is a number:
      if (isNaN(teacher_id)) {
          return res.status(400).json({ msg: "Invalid Teacher ID format." });
      }

      const comments = await Comments.find({ teacher_id });
      
      // Handling no comments found
      if (comments.length === 0) {
          return res.status(404).json({ msg: "No comments found for the specified teacher." });
      }

      res.status(200).json(comments);
  } catch (error) {
      console.error(error);
      // Providing more specific error messages could be useful here, 
      // but ensure not to disclose sensitive system information
      res.status(500).json({ msg: "Internal server error", error: error.toString() });
  }
});


router.post('/getcommentsofcourse', authenticateToken, requireRole("User"), async (req, res) => {
  try {
      const { course_id } = req.body;

      // Input validation
      if (!course_id) {
          return res.status(400).json({ msg: "Course ID is required" });
      }

      // Optionally, further validate course_id format or existence in the database before querying comments

      const comments = await Comments.find({ course_id });

      // Handle case where no comments are found for the specified course
      if (!comments.length) {
          return res.status(404).json({ msg: "No comments found for the specified course" });
      }

      res.json(comments);
  } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error" });
  }
});


router.post('/getcommentsforteacherandcourse', authenticateToken, requireRole("User"), async (req, res) => {
  try {
      const { teacher_id, course_id } = req.body;

      // Input validation for teacher_id
      if (!teacher_id) {
          return res.status(400).json({ msg: "Teacher ID is required." });
      }
      
      if (isNaN(teacher_id)) {
          return res.status(400).json({ msg: "Invalid Teacher ID format." });
      }

      // Input validation for course_id
      if (!course_id) {
          return res.status(400).json({ msg: "Course ID is required." });
      }

      if (isNaN(course_id)) {
          return res.status(400).json({ msg: "Invalid Course ID format." });
      }

      const comments = await Comments.find({ teacher_id, course_id });
      
      // Handling no comments found
      if (comments.length === 0) {
          return res.status(404).json({ msg: "No comments found for the specified teacher and course." });
      }

      res.status(200).json(comments);
  } catch (error) {
      console.error(error);
      res.status(500).json({ msg: "Internal server error", error: error.toString() });
  }
});




router.get('/getallteachers',authenticateToken,requireRole("User"), async (req, res) => {
  try {
    const teachers = await Teachers.find({});
    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});








router.post('/getteachersforcourse', authenticateToken, requireRole("User"), async (req, res) => {
  try {
    const { course_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ msg: "Course ID is required." });
    }

    // First, find the course by its ID to get the list of teacher IDs
    const course = await Courses.findById(course_id);

    if (!course) {
      return res.status(404).json({ msg: "Course not found." });
    }

    // Extract teacher Object IDs from the course document
    const teacherIds = course.Teachers;

    // Then, find all teachers whose IDs are in the course's Teachers array
    const teachers = await Teachers.find({
      '_id': { $in: teacherIds }
    });

    if (teachers.length === 0) {
      return res.status(404).json({ msg: "No teachers found for this course." });
    }

    res.status(200).json(teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});

router.post('/getcoursesforteacher', authenticateToken, requireRole("User"), async (req, res) => {
  try {
    const { teacher_id } = req.body; // Assuming you're passing the teacher's ObjectId in the request
    
    if (!teacher_id) {
      return res.status(400).json({ msg: "Teacher ID is required." });
    }

    // Find the teacher by their ID to get the list of Course ObjectIds
    const teacher = await Teachers.findById(teacher_id);

    if (!teacher) {
      return res.status(404).json({ msg: "Teacher not found." });
    }

    // Use the CoursesTaughtIDs to find all corresponding courses
    const courses = await Courses.find({
      '_id': { $in: teacher.CoursesTaughtIDs }
    });

    if (!courses.length) {
      return res.status(404).json({ msg: "No courses found for this teacher." });
    }

    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});


router.get('/getallcourses', authenticateToken, requireRole("User"), async (req, res) => {
  try {
    const courses = await Courses.find({}); // Finds all courses
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error", error: error.message });
  }
});


router.post('/createTeacher', authenticateToken, requireRole("Moderator"), async (req, res) => {
  try {
    const { Name, Title, Email, Overview, CoursesTaught, Department, Specialization, OnboardStatus, ImageFile } = req.body;
    
    // For demonstration, using a static email. In a real app, derive this from the authenticated user.
    const user = "zohaibalimughal7@gmail.com";

    // Convert course names to ObjectIds
    const courses = await Courses.find({ 'Course_name': { $in: CoursesTaught } });
    const CoursesTaughtIDs = courses.map(course => course._id);

    // Check if all provided course names were found as valid courses
    if (CoursesTaught.length !== CoursesTaughtIDs.length) {
      return res.status(400).json({ msg: "One or more courses not found." });
    }

    const newTeacher = await Teachers.create({
      Name,
      Title,
      Email,
      Overview,
      CoursesTaught,
      CoursesTaughtIDs, // Include the array of course ObjectIds
      Department,
      Specialization,
      OnboardStatus,
      ImageFile,
      createdBy: user,
      modifiedBy: user,
      createdAt: new Date(),
      modifiedAt: new Date(),
      isDeleted: false // Explicitly set, though default value is false as per schema
    });

    res.json({ msg: "Teacher created successfully", teacher: newTeacher });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});


router.patch('/updateTeacher', authenticateToken, requireRole("Moderator"), async (req, res) => {
  try {
    const { id, Name, Title, Email, Overview, CoursesTaught, Department, Specialization, OnboardStatus, ImageFile } = req.body;

    // For demonstration, using a static email. In a real app, derive this from the authenticated user.
    const user = "zohaibalimughal7@gmail.com";

    let updateData = {
      ...(Name && {Name}),
      ...(Title && {Title}),
      ...(Email && {Email}),
      ...(Overview && {Overview}),
      ...(Department && {Department}),
      ...(Specialization && {Specialization}),
      ...(OnboardStatus && {OnboardStatus}),
      ...(ImageFile && {ImageFile}),
      modifiedBy: user,
      modifiedAt: new Date(),
    };

    // If CoursesTaught is provided, convert course names to ObjectIds
    if (CoursesTaught && CoursesTaught.length > 0) {
      const courses = await Courses.find({ 'Course_name': { $in: CoursesTaught } });
      const CoursesTaughtIDs = courses.map(course => course._id);

      // Check if all provided course names were found as valid courses
      if (CoursesTaught.length !== CoursesTaughtIDs.length) {
        return res.status(400).json({ msg: "One or more courses not found." });
      }

      updateData.CoursesTaught = CoursesTaught;
      updateData.CoursesTaughtIDs = CoursesTaughtIDs;
    }

    const updatedTeacher = await Teachers.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedTeacher) {
      return res.status(404).json({ msg: "Teacher not found." });
    }

    res.json({ msg: "Teacher updated successfully", teacher: updatedTeacher });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});


router.delete('/deleteteacher', authenticateToken,requireRole("Moderator"), async (req, res) => {
  try {
    const { objectId } = req.body;
    const teacherToDelete = await Teachers.findById(objectId);

    if (!teacherToDelete) {
      return res.status(404).json({ msg: "teacher not found" });
    }

    // Check if the user is an Admin/Moderator or if the ERP matches
    const hasPermission = req.user.roles.includes('Admin') || 
                          req.user.roles.includes('Moderator')


    if (!hasPermission) {
      return res.status(403).json({ msg: "Not authorized to delete this teacher" });
    }

    // Perform a soft delete by setting isDeleted to true
    teacherToDelete.isDeleted = true;
    teacherToDelete.modifiedAt = new Date(); // Optionally update the modified date
    teacherToDelete.modifiedBy = req.user.email; // Optionally update the modifier's email
    await teacherToDelete.save();

    res.json({ msg: "teacher deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Internal server error" });
  }
});



router.post('/saveComment',authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const erp = req.user.erp;

  console.log('Saving comment:', commentId, 'for user:', erp);
  // Validate the input
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).send('Invalid or missing comment ID.');
  }
  if (!erp) {
      return res.status(400).send('Missing user ERP.');
  }

  try {
      // Find the user by ERP and update
      const user = await User.findOneAndUpdate(
          { erp: erp },
          { $addToSet: { saved_comments: commentId } }, // $addToSet prevents duplicate ids
          { new: true } // Return the updated document
      );

      if (!user) {
          return res.status(404).send('User not found');
      }

      res.status(200).json(user);
  } catch (error) {
      // Handle specific error codes
      if (error.name === 'CastError') {
          res.status(400).send('Invalid data format.');
      } else if (error.name === 'ValidationError') {
          let messages = Object.values(error.errors).map(val => val.message);
          res.status(400).send(messages.join(', '));
      } else {
          console.error('Error saving comment:', error); // It's helpful to log the error for debugging.
          res.status(500).send('Server error');
      }
  }
});



router.post('/removefromsavedcomments', authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const erp = req.user.erp; // Adjust if ERP is located differently in your user object

  // Log the operation for debugging
  console.log('Removing comment:', commentId, 'for user:', erp);

  // Validate the input
  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).send('Invalid or missing comment ID.');
  }
  if (!erp) {
      return res.status(400).send('Missing user ERP.');
  }

  try {
      // Find the user by ERP and update by pulling the commentId from saved_comments
      const user = await User.findOneAndUpdate(
          { erp: erp },
          { $pull: { saved_comments: commentId } }, // $pull removes the id from the array
          { new: true } // Return the updated document
      );

      if (!user) {
          return res.status(404).send('User not found');
      }

      res.status(200).json(user);
  } catch (error) {
      // Handle specific error codes
      if (error.name === 'CastError') {
          res.status(400).send('Invalid data format.');
      } else if (error.name === 'ValidationError') {
          let messages = Object.values(error.errors).map(val => val.message);
          res.status(400).send(messages.join(', '));
      } else {
          console.error('Error removing comment:', error); // Logging the error
          res.status(500).send('Server error');
      }
  }
});



router.get('/getSavedComments', authenticateToken, async (req, res) => {
  const erp = req.user.erp; // Assuming req.user.erp is populated by your authentication middleware

  try {
      // First, find the user to get their saved_comments
      const user = await User.findOne({ erp: erp });
      if (!user) {
          return res.status(404).send('User not found.');
      }

      // Extract the saved comment IDs from the user document and convert them to ObjectId instances
      const savedCommentIds = user.saved_comments.map(id => new mongoose.Types.ObjectId(id));

      // Now, fetch the actual comment data for these IDs from the comments collection
      const comments = await Comments.find({ '_id': { $in: savedCommentIds } });

      // Return the comments to the client
      res.status(200).json(comments);
  } catch (error) {
      console.error('Error fetching saved comments:', error); // Logging the error
      res.status(500).send('Server error');
  }
});


// Route to upvote a comment
router.post('/upvotecomment', authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const userErp = req.user.erp; // Assuming you have middleware that sets req.user

  if (!commentId) {
      return res.status(400).send('Missing comment ID.');
  }

  try {
      // Find the comment to check if the user has already upvoted it
      const comment = await Comments.findById(commentId);

      if (!comment) {
          return res.status(404).send('Comment not found.');
      }

      // Check if the user's ERP is in the upvotedBy array
      if (comment.upvotedBy.includes(userErp)) {
          // User has already upvoted this comment
          return res.status(400).send('You have already upvoted this comment.');
      }

      // User has not upvoted yet, proceed to upvote
      const updatedComment = await Comments.findByIdAndUpdate(
          commentId,
          { 
              $inc: { upvotes: 1 }, // Increment upvotes by 1
              $push: { upvotedBy: userErp } // Add user's ERP to upvotedBy
          },
          { new: true, runValidators: true }
      );

      res.status(200).json(updatedComment);
  } catch (error) {
      console.error('Error upvoting comment:', error);
      res.status(500).send('Server error');
  }
});



router.post('/downvotecomment', authenticateToken, async (req, res) => {
  const { commentId } = req.body;
  const userErp = req.user.erp; // Assuming you have middleware that sets req.user

  if (!commentId) {
      return res.status(400).send('Missing comment ID.');
  }

  try {
      // Find the comment to check if the user has already downvoted it
      const comment = await Comments.findById(commentId);

      if (!comment) {
          return res.status(404).send('Comment not found.');
      }

      // Check if the user's ERP is in the downvotedBy array
      if (comment.downvotedBy.includes(userErp)) {
          // User has already downvoted this comment
          return res.status(400).send('You have already downvoted this comment.');
      }

      // User has not downvoted yet, proceed to downvote
      const updatedComment = await Comments.findByIdAndUpdate(
          commentId,
          { 
              $inc: { downvotes: 1 }, // Increment downvotes by 1
              $push: { downvotedBy: userErp } // Add user's ERP to downvotedBy
          },
          { new: true, runValidators: true }
      );

      res.status(200).json(updatedComment);
  } catch (error) {
      console.error('Error downvoting comment:', error);
      res.status(500).send('Server error');
  }
});



router.post('/saveteacher', authenticateToken, async (req, res) => {
  const { teacherId } = req.body;
  const erp = req.user.erp;

  if (!teacherId) {
      return res.status(400).send('Invalid or missing teacher ID.');
  }

  try {
      const user = await User.findOneAndUpdate(
          { erp: erp },
          { $addToSet: { saved_teachers: teacherId } },
          { new: true }
      );

      if (!user) {
          return res.status(404).send('User not found');
      }

      res.status(200).json(user);
  } catch (error) {
      console.error('Error saving teacher:', error);
      res.status(500).send('Server error');
  }
});


router.post('/removesavedteacher', authenticateToken, async (req, res) => {
  const { teacherId } = req.body;
  const erp = req.user.erp;

  if (!teacherId) {
      return res.status(400).send('Invalid or missing teacher ID.');
  }

  try {
      const user = await User.findOneAndUpdate(
          { erp: erp },
          { $pull: { saved_teachers: teacherId } },
          { new: true }
      );

      if (!user) {
          return res.status(404).send('User not found');
      }

      res.status(200).json(user);
  } catch (error) {
      console.error('Error removing saved teacher:', error);
      res.status(500).send('Server error');
  }
});


router.get('/getSavedTeachers', authenticateToken, async (req, res) => {
  const erp = req.user.erp;

  try {
      const user = await User.findOne({ erp: erp });
      if (!user || !user.saved_teachers.length) {
          return res.status(404).send('No saved teachers found.');
      }

      // Assuming you have a Teacher model set up
      const savedTeachers = await Teachers.find({
          '_id': { $in: user.saved_teachers }
      });

      res.status(200).json(savedTeachers);
  } catch (error) {
      console.error('Error fetching saved teachers:', error);
      res.status(500).send('Server error');
  }
});
