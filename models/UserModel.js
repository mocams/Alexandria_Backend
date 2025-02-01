const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    },
    storageUsed: {
        type: Number,
        default: 0  // in bytes
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },  // Include virtuals when converting to JSON
    toObject: { virtuals: true }
});

// Virtual field for total books
userSchema.virtual('totalBooks', {
    ref: 'Book',
    localField: '_id',
    foreignField: 'user',
    count: true
});

// Virtual field for total books read
userSchema.virtual('totalBooksRead', {
    ref: 'Book',
    localField: '_id',
    foreignField: 'user',
    count: true,
    match: { read: true }  // Only count books where read is true
});

// Method to update storage used
userSchema.methods.updateStorageUsed = async function() {
    const Book = mongoose.model('Book');
    const books = await Book.find({ user: this._id });
    
    // Calculate total storage (assuming each book has a size field)
    // You'll need to add logic to calculate/store file sizes when adding books
    this.storageUsed = books.reduce((total, book) => total + (book.fileSize || 0), 0);
    await this.save();
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

// Method to get user stats
userSchema.methods.getStats = async function() {
    await this.populate(['totalBooks', 'totalBooksRead']);
    
    return {
        totalBooks: this.totalBooks || 0,
        totalBooksRead: this.totalBooksRead || 0,
        storageUsed: this.storageUsed || 0,
        storageUsedFormatted: formatBytes(this.storageUsed)
    };
};

// Helper function to format bytes into readable format
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

module.exports = mongoose.models.User || mongoose.model('User', userSchema); 