// middleware/requireRole.js

/**
 * Middleware to enforce role-based access control.
 * @param {...string} roles - Required roles to access the resource.
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
      if (!req.user || !req.user.roles) {
        return res.status(403).json({ message: "Access denied: No user roles found." });
      }
  
      const hasRequiredRole = req.user.roles.some(role => roles.includes(role));
  
      if (!hasRequiredRole) {
        return res.status(403).json({ message: "Access denied: User does not have the required role." });
      }
  
      next();
    };
  };
  
  module.exports = requireRole;
  