const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  // Store the full path from root to this category
  path: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // Store the level depth (0 for root categories)
  level: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure name uniqueness per user and parent folder
categorySchema.index({ name: 1, user: 1, parent: 1 }, { unique: true });

// Update path and level before saving
categorySchema.pre('save', async function(next) {
  if (this.parent) {
    const parent = await this.constructor.findById(this.parent);
    if (parent) {
      this.path = [...parent.path, parent._id];
      this.level = parent.level + 1;
    }
  } else {
    this.path = [];
    this.level = 0;
  }
  next();
});

// Helper methods
categorySchema.methods.getChildren = function() {
  return this.constructor.find({ parent: this._id });
};

categorySchema.methods.getSubtree = function() {
  return this.constructor.find({ path: this._id });
};

const Category = mongoose.model('Category', categorySchema);