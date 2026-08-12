const multer = require('multer');
const createError = require('http-errors');
const path = require('path');

// Configure memory storage
const storage = multer.memoryStorage();

// Validate file type
const fileFilter = (req, file, cb) => {
  // Check explicit mimetypes
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(createError(400, 'Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }

  // Also check extension as a fallback
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  
  if (!allowedExtensions.includes(ext)) {
    return cb(createError(400, 'Invalid file extension. Only JPG, PNG, and WebP are allowed.'));
  }

  cb(null, true);
};

// Create multer upload instance
// Limit file size to 5MB
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

module.exports = upload;
