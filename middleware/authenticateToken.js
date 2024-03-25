const jwt = require('jsonwebtoken');
const securityKey = "ZohaibMughal"; // Ensure you have this environment variable set

/**
 * Middleware to authenticate a JWT token.
 */
const authenticateToken = (req, res, next) => {
  // Extract the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Conventionally, Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, securityKey);
    req.user = decoded; // Attach the decoded payload to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = authenticateToken;
