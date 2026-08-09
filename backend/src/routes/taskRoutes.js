const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  createTask,
  getProjectTasks,
  getAllTasks,
  updateTask,
  deleteTask,
  addComment,
  getTaskComments,
  getTaskActivities,
} = require('../controllers/taskController');
const { verifyToken } = require('../middleware/auth');

// All routes require authentication
router.use(verifyToken);

// GET all tasks - for admin/manager view
// This must come BEFORE the /:id routes to avoid conflicts
router.get('/', getAllTasks);

// Task CRUD
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Task comments
router.post('/:id/comments', addComment);
router.get('/:id/comments', getTaskComments);

// Task activity
router.get('/:id/activities', getTaskActivities);

module.exports = router;