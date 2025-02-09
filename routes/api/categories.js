const express = require('express');
const router = express.Router();
const Category = require('../../models/categoryModel')
const Book = require('../../models/bookModel');
const { authMiddleware } = require('../../middlewares/authMiddleware');

// Create a new category
router.post('/createCategory', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;  // Get real user ID
        const { name, description } = req.body;

        const category = await Category.create({
            name,
            description,
            user: userId
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            category
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: err.message
        });
    }
});

// Get all categories for a user with populated books
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user._id;
        const categories = await Category.find({ user: userId })
            .populate({
                path: 'books',
                select: 'title author coverPath read progress' // Select the fields you want to return
            });

        res.status(200).json({
            success: true,
            categories
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: err.message
        });
    }
});

// Update book's category
router.put('/updateBookCategory/:bookId', authMiddleware, async (req, res) => {
    try {
        const { bookId } = req.params;
        const { categoryId } = req.body;
        const userId = req.user._id;

        // If categoryId is provided, update both book and category
        if (categoryId) {
            // Verify category exists and user has access
            const category = await Category.findOne({ _id: categoryId, user: userId });
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found or unauthorized'
                });
            }

            // Remove book from all categories first
            await Category.updateMany(
                { user: userId },
                { $pull: { books: bookId } }
            );

            // Add book to new category
            await Category.findByIdAndUpdate(
                categoryId,
                { $addToSet: { books: bookId } }
            );

            // Update book's categories
            const updatedBook = await Book.findOneAndUpdate(
                { _id: bookId, user: userId },
                { $set: { categories: [categoryId] } },
                { new: true }
            ).populate('categories');

            // Get all updated categories with populated books
            const allCategories = await Category.find({ user: userId })
                .populate({
                    path: 'books',
                    select: 'title author coverPath read progress'
                });

            res.status(200).json({
                success: true,
                message: 'Book category updated successfully',
                book: updatedBook,
                categories: allCategories
            });
        } else {
            // If no categoryId, find the uncategorized category
            const uncategorizedCategory = await Category.findOne({ 
                user: userId, 
                isDefault: true 
            });

            // Remove book from all categories
            await Category.updateMany(
                { user: userId },
                { $pull: { books: bookId } }
            );

            // Add book to uncategorized category
            if (uncategorizedCategory) {
                await Category.findByIdAndUpdate(
                    uncategorizedCategory._id,
                    { $addToSet: { books: bookId } }
                );
            }

            // Update book to use uncategorized category
            const updatedBook = await Book.findOneAndUpdate(
                { _id: bookId, user: userId },
                { 
                    $set: { 
                        categories: uncategorizedCategory ? [uncategorizedCategory._id] : [] 
                    } 
                },
                { new: true }
            ).populate('categories');

            // Get all updated categories with populated books
            const allCategories = await Category.find({ user: userId })
                .populate({
                    path: 'books',
                    select: 'title author coverPath read progress'
                });

            res.status(200).json({
                success: true,
                message: 'Book moved to uncategorized category',
                book: updatedBook,
                categories: allCategories
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error updating book category',
            error: err.message
        });
    }
});

// Remove book from category
router.delete('/:categoryId/books/:bookId', async (req, res) => {
    try {
        const { categoryId, bookId } = req.params;
        const userId = 'default_id'; // Replace with actual user authentication later

        const book = await Book.findOneAndUpdate(
            { _id: bookId, user: userId },
            { $pull: { categories: categoryId } },
            { new: true }
        ).populate('categories');

        if (!book) {
            return res.status(404).json({
                success: false,
                message: 'Book not found or unauthorized'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Book removed from category successfully',
            book
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error removing book from category',
            error: err.message
        });
    }
});

// Delete category
router.delete('/:categoryId', authMiddleware, async (req, res) => {
    try {
        const { categoryId } = req.params;
        const userId = req.user._id;

        // Update all books to remove this category
        await Book.updateMany(
            { user: userId },
            { $pull: { categories: categoryId } }
        );

        // Delete the category
        const category = await Category.findOneAndDelete({
            _id: categoryId,
            user: userId
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found or unauthorized'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
            category
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: err.message
        });
    }
});

module.exports = router; 