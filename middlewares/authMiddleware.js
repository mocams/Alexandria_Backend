const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

const JWT_SECRET = 'your-secret-key'; // Move this to environment variables in production

const authMiddleware = async (req, res, next) => {
    try {
       // Get token from Authorization header
       const authHeader = req.header('Authorization');
       const userId = req.header('User-Id');

       // Check if no auth header
       if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'No authorization header, access denied'
            });
        }

        // Extract token from Bearer format
        const token = authHeader.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token found, authorization denied'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Verify that the decoded userId matches the User-Id header
        if (decoded.userId !== userId) {
            return res.status(401).json({
                success: false,
                message: 'User ID mismatch'
            });
        }
        
        // Find user by id
        const user = await User.findById(decoded.userId);
        
        // Check if user exists
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add user to request object
        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

module.exports = { authMiddleware }; 