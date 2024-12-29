const express = require('express');
const router = express.Router();
const Book = require('../../models/bookModel');
const Category = require('../../models/CategoryModel');  //
// Function to create a normalized fingerprint
const createBookFingerprint = (title, author) => {
    // Remove special characters, extra spaces, and convert to lowercase
    const normalizeText = (text) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
        .trim();
    };
  
    const normalizedTitle = normalizeText(title);
    const normalizedAuthor = normalizeText(author);
  
    return `${normalizedTitle}-${normalizedAuthor}`;
  };
  
  const isBookDuplicate = async (book, userId) => {
    const fingerprint = createBookFingerprint(book.title, book.author);
    
    const existingBook = await Book.findOne({
      user: userId,
      fingerprint: fingerprint
    });
  
    return existingBook !== null;
  };

  // Will return the amount of books a user have
const getUserBooksCount = async (userId) => {
    try {
        return await Book.countDocuments({ user: userId });
    } catch (err) {
        console.error('Error counting books:', err);
        throw err;
    }
};

const getAllUserBooks = async (userId) => {
    try {
        const books = await Book.find({ user: userId })
            .select('-fingerprint')
            .populate('categories')
            .sort({ createdAt: -1 });

        const count = await getUserBooksCount(userId);

        return {
            books,
            count
        };
    } catch (err) {
        console.error('Error fetching library:', err);
        throw err;
    }
};


const addNewBooksInLibrary = async (booksToAdd, userId) => {
    try {
        const results = {
            added: [],
            duplicates: []
        };

        for (const book of booksToAdd) {
            const isDuplicate = await isBookDuplicate(book, userId);
            
            if (isDuplicate) {
                results.duplicates.push({
                    title: book.title,
                    author: book.author
                });
                continue;
            }

            // Add fingerprint and userId to the book
            const bookToAdd = {
                ...book,
                user: userId,
                fingerprint: createBookFingerprint(book.title, book.author)
            };

            const newBook = await Book.create(bookToAdd);
            results.added.push(newBook);
        }

        return results;
    }
    catch(err) {
        console.log(err);
        throw err;
    }
};

// Function to delete a book
const deleteBook = async (bookId, userId) => {
    try {
        const book = await Book.findOneAndDelete({ _id: bookId, user: userId });
        
        if (!book) {
            throw new Error('Book not found or unauthorized');
        }
        
        return book;
    } catch (err) {
        console.error('Error deleting book:', err);
        throw err;
    }
};

// Function to update book progress
const updateBookProgress = async (bookId, progress, userId) => {
    try {
        const book = await Book.findOneAndUpdate(
            { _id: bookId, user: userId },
            { progress: progress },
            { new: true }
        );
        
        if (!book) {
            throw new Error('Book not found or unauthorized');
        }
        
        return book;
    } catch (err) {
        console.error('Error updating book progress:', err);
        throw err;
    }
};

router.post('/addNewBooksInLibrary', async (req,res) => {
    try {
        const booksToAdd = req.body;
        //const userId = req.user._id;
        const userId = 'default_id'
        const result = await addNewBooksInLibrary(booksToAdd, userId);
        
        res.status(200).json({ 
            success: true, 
            message: `Added ${result.added.length} books. ${result.duplicates.length} duplicates found.`,
            result
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: 'Error adding books',
            error: err.message 
        });
    }
}
)

// Route to update book progress
router.put('/progress/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const { progress } = req.body;
        const userId = 'default_id'; // Replace with actual user authentication later
        
        if (progress < 0 || progress > 100) {
            return res.status(400).json({
                success: false,
                message: 'Progress must be between 0 and 100'
            });
        }

        const updatedBook = await updateBookProgress(bookId, progress, userId);
        
        res.status(200).json({
            success: true,
            message: 'Progress updated successfully',
            book: updatedBook
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error updating book progress',
            error: err.message
        });
    }
});

// Route to delete a book
router.delete('/deleteBook/:bookId', async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = 'default_id'; // Replace with actual user authentication later
        
        const deletedBook = await deleteBook(bookId, userId);
        
        res.status(200).json({
            success: true,
            message: 'Book deleted successfully',
            book: deletedBook
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error deleting book',
            error: err.message
        });
    }
});
// Get all books for a user
// Routes
router.get('/', async (req, res) => {
    try {
        const userId = 'default_id';
        const { books, count } = await getAllUserBooks(userId);

        res.status(200).json({
            success: true,
            message: `Found ${count} books`,
            books,
            count
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching books',
            error: err.message
        });
    }
});

module.exports = router;