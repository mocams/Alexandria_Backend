const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/UserModel');

const JWT_SECRET = 'your-secret-key'; // Move this to environment variables in production

// Helper function to generate token and expiration
const generateToken = (userId) => {
    const expiresIn = '24h';
    const expirationMs = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now in milliseconds
    
    const token = jwt.sign(
        { userId: userId },
        JWT_SECRET,
        { expiresIn }
    );

    return { token, expirationMs };
};

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password
        });

        await user.save();

        // Generate token with expiration
        const { token, expirationMs } = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user,
            expirationMs,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: err.message
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token with expiration
        const { token, expirationMs } = generateToken(user._id);


        res.json({
            success: true,
            message: 'Login successful',
            token,
            user,
            expirationMs
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: err.message
        });
    }
});

// Middleware to protect routes
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('x-auth-token');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.userId);
        next();
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

// Protected route example
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({
            success: true,
            user
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: err.message
        });
    }
});

module.exports = router; 