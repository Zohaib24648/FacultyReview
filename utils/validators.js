// utils/validators.js

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


const erpValidator = {
  validator: function(value) {
      // Ensure the value is a number and has a length of 5 digits
      return /^\d{5}$/.test(value.toString());
  },
  message: "ERP number must be exactly 5 digits long."
};

  
  module.exports = { emailValidator, passwordValidator, emptyValidator, erpValidator };
  