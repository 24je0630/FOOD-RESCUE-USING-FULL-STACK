const cloudinary = require('../config/cloudinary');

/**
 * Uploads an image buffer to Cloudinary using a memory stream.
 * @param {Buffer} buffer - The image file buffer from Multer
 * @param {string} folder - The destination folder in Cloudinary
 * @returns {Promise<Object>} Resolves with { url, publicId }
 */
const uploadImage = (buffer, folder = 'food-rescue') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return reject(new Error('Failed to upload image to Cloudinary'));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    
    uploadStream.end(buffer);
  });
};

/**
 * Deletes an image from Cloudinary by its public ID.
 * @param {string} publicId - The Cloudinary public ID of the asset
 * @returns {Promise<boolean>} Resolves to true if successful
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    // Don't throw here to avoid breaking application flows if cleanup fails.
    return false;
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};
