const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} = require('../controllers/projectController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Import task routes
const taskRoutes = require('./taskRoutes');
const chatRoutes = require('./chatRoutes');

// All routes require authentication
router.use(verifyToken);

// Project CRUD
router.post('/', checkRole(['ADMIN', 'PROJECT_MANAGER']), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', checkRole(['ADMIN', 'PROJECT_MANAGER']), updateProject);
router.delete('/:id', checkRole(['ADMIN']), deleteProject);

// Project members
router.post('/:id/members', checkRole(['ADMIN', 'PROJECT_MANAGER']), addMember);
router.delete('/:id/members/:memberId', checkRole(['ADMIN', 'PROJECT_MANAGER']), removeMember);

// Task routes (nested under project)
router.use('/:projectId/tasks', taskRoutes);

// Chat routes (nested under project)
router.use('/:projectId/chat', chatRoutes);

module.exports = router;