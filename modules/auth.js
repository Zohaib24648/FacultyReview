const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const e = require('express');
const router = express.Router();
router.use(express.json());
module.exports = router; // Export the router


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
    
