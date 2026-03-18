// ============================================================
// Upload Routes — /api/uploads
// Returns signed parameters so the client can upload
// directly to Cloudinary (no binary data goes through our server).
// ============================================================
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { getSignedUploadParams } = require('../services/cloudinary');

// Valid upload folders
const FOLDERS = {
  avatar: 'kaya/avatars',
  service: 'kaya/services',
  portfolio: 'kaya/portfolio',
  message: 'kaya/messages',
  dispute: 'kaya/disputes',
};

// ─── GET /api/uploads/sign?type=avatar|service|portfolio|message|dispute
router.get('/sign', authenticate, (req, res) => {
  const { type = 'service' } = req.query;
  const folder = FOLDERS[type] || FOLDERS.service;
  const params = getSignedUploadParams(folder);
  res.json(params);
});

module.exports = router;
