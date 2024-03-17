const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
router.use(express.json());
const securitykey ="ZohaibMughal";

const emailValidator = {
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



  const User = mongoose.model('User', userSchema);

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
      required:true
    },

    lastname : {
      type:String,
      required:true
    },
    age: {type:Number,
    required:true},
    roles : {type:String,
    default:"User"}
  });


  
