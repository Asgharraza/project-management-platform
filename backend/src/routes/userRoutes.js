const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateProfile,
  updatePassword,
  updateUserRole,
  deleteUser,
  resetUserPassword,
} = require('../controllers/userController');
const { verifyToken, checkRole } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// Profile routes (self)
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

// Admin only routes
router.get('/', checkRole(['ADMIN']), getUsers);
router.get('/:id', checkRole(['ADMIN']), getUserById);
router.put('/:id/role', checkRole(['ADMIN']), updateUserRole);
router.put('/:id/reset-password', checkRole(['ADMIN']), resetUserPassword);
router.delete('/:id', checkRole(['ADMIN']), deleteUser);

module.exports = router;