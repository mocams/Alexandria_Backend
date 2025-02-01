const { type } = require('express/lib/response');
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  coverPath : {
    type : String,
    required : true,
    trim : true
  },
  isbn: {
    type: String,
    trim: true
  },
  /*user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    default  : ''
  },*/
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  description: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Add a normalized fingerprint field
  fingerprint: {
    type: String,
    required: true,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  fileUri : {
    type : String,
    required : true
  },
  progress: {
    type: Number,
    default: 0,
    required : true,
    min: 0,
    max: 100
  },
  fileType : {
    type : String,
    required : true,
    trim : true,
    default : 'pdf'
  },
  read : {
    type : Boolean,
    default : false,
    required : true
  }
});

// Update the 'updatedAt' field on save
bookSchema.pre('save', async (next) => {
  this.updatedAt = Date.now();
  next();
});

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;