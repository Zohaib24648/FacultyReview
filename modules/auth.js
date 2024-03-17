const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
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

  const loginUsernameValidator = {
    validator: function(value) {
        const isValid = /^([^\s@]+@[^\s@]+\.[^\s@]+|\d{5})$/.test(value);
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
      if (!isvalid) {throw new Error("Password must contain at least 1 uppercase letter, 1 number, and have a length greater than 8.");
    }
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
      if (user) return res.json({ msg: "This email is already in use" });
      
      let user1 = await User.findOne({ erp });
      if (user1) return res.json({ msg: "This ERP is already in use" });
      
      // Check if the password is valid
      if (passwordValidator.validator(password)) {
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create a new user in database and respond
      await User.create({ email, password: hashedPassword,firstname,lastname,erp});
      return res.status(200).json({ msg: "Successful" });}

      // If the password is invalid, throw an error
      throw new Error("Password must contain at least 1 uppercase letter, 1 number, and have a length greater than 8.")
    } catch (error) {
      // If the error is a validation error(MongoDB), respond with a 400 status code
      if (error.name === 'ValidationError') {
        console.log("Details do not match the database requirements. Please enter valid details.");
        return res.status(400).json({ msg: error.message });
      } else {
        console.error(error);
        return res.status(500).json({ msg: error.message });
      }
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { loginUsername, password } = req.body;
  
      //check for valid ERP or email format
      if (!loginUsernameValidator(loginUsername)) return res.json({ msg: "Invalid Username. Please Enter ERP or Email Address" });
  
      // Determine if the loginUsername is an ERP or an email
      let user;
      if (loginUsername.includes('@')) {
        // If loginUsername contains '@', treat it as an email
        user = await User.findOne({ email: loginUsername });
      } else {
        // Otherwise, treat it as an ERP
        user = await User.findOne({ erp: loginUsername });
      }
  
      if (!user) return res.json({ msg: "This ERP or Email is not linked to any account" });
  
      const passwordCheck = await bcrypt.compare(password, user.password);
      if (!passwordCheck) return res.json({ msg: "Incorrect Password" });
  
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
      console.error(error);
      return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
    }
  });
  



  
