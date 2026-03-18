// ============================================================
// Cloudinary Service
// Generates signed upload parameters so the browser uploads
// directly to Cloudinary — the server never handles binary data.
// ============================================================
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Generate a signed upload preset for direct browser → Cloudinary uploads.
 * The client sends the file directly to Cloudinary using these params.
 *
 * @param {string} folder - e.g. 'kaya/avatars', 'kaya/services', 'kaya/messages'
 * @param {string} [publicId] - optional custom public ID
 */
function getSignedUploadParams(folder = 'kaya/uploads', publicId) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    ...(publicId && { public_id: publicId }),
  };

  // Build the string to sign (alphabetically sorted)
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  const signature = crypto
    .createHash('sha256')
    .update(toSign + process.env.CLOUDINARY_API_SECRET)
    .digest('hex');

  return {
    signature,
    timestamp,
    folder,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  };
}

/**
 * Delete an asset from Cloudinary by its public ID.
 */
async function deleteAsset(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

module.exports = { cloudinary, getSignedUploadParams, deleteAsset };
