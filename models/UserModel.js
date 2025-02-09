const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Book = require('./bookModel');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for total books
userSchema.virtual('totalBooks', {
    ref: 'Book',
    localField: '_id',
    foreignField: 'user',
    count: true
});

// Virtual for total books read
userSchema.virtual('totalBooksRead', {
    ref: 'Book',
    localField: '_id',
    foreignField: 'user',
    count: true,
    match: { read: true }
});

// Method to get books stats by category
userSchema.methods.getBookStatsByCategory = async function() {
    const stats = await Book.aggregate([
        // Match books for this user
        { $match: { user: this._id } },
        // Unwind categories array to handle books in multiple categories
        { $unwind: { path: '$categories', preserveNullAndEmptyArrays: true } },
        // Group by category
        {
            $group: {
                _id: '$categories',
                totalBooks: { $sum: 1 },
                readBooks: {
                    $sum: { $cond: [{ $eq: ['$read', true] }, 1, 0] }
                }
            }
        },
        // Lookup category details
        {
            $lookup: {
                from: 'categories',
                localField: '_id',
                foreignField: '_id',
                as: 'categoryDetails'
            }
        },
        // Unwind category details
        { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
        // Project final format
        {
            $project: {
                _id: 1,
                categoryName: { $ifNull: ['$categoryDetails.name', 'Uncategorized'] },
                totalBooks: 1,
                readBooks: 1,
                unreadBooks: { $subtract: ['$totalBooks', '$readBooks'] }
            }
        }
    ]);

    return stats;
};

// Method to get complete user stats
userSchema.methods.getCompleteStats = async function() {
    await this.populate(['totalBooks', 'totalBooksRead']);
    
    const categoryStats = await this.getBookStatsByCategory();
    
    return {
        totalBooks: this.totalBooks || 0,
        totalBooksRead: this.totalBooksRead || 0,
        totalUnreadBooks: (this.totalBooks || 0) - (this.totalBooksRead || 0),
        categoriesStats: categoryStats
    };
};

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema); 