const prisma = require('../../prisma-client');
const { createNotification } = require('./notificationController');

// Get all tasks (for admin/manager)
const getAllTasks = async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get project tasks
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Create task
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, dueDate, assigneeId } = req.body;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check permissions
    if (req.user.role === 'TEAM_MEMBER') {
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId,
          userId: req.user.id,
        },
      });
      if (!isMember) {
        return res.status(403).json({ error: 'You are not a member of this project.' });
      }
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId: assigneeId || req.user.id,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await prisma.taskActivity.create({
      data: {
        action: 'CREATED',
        details: `Task "${task.title}" was created`,
        taskId: task.id,
        userId: req.user.id,
      },
    });

    // 🔔 Send notification to assignee
    if (assigneeId && assigneeId !== req.user.id) {
      await createNotification(
        assigneeId,
        'TASK_ASSIGNED',
        `New task "${task.title}" has been assigned to you in project "${project.name}"`,
        `/projects/${projectId}`
      );
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Check permissions
    if (req.user.role === 'TEAM_MEMBER') {
      const isMember = await prisma.projectMember.findFirst({
        where: {
          projectId: task.projectId,
          userId: req.user.id,
        },
      });
      if (!isMember) {
        return res.status(403).json({ error: 'You are not a member of this project.' });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    let activityDetails = `Task "${updatedTask.title}" was updated`;
    if (status && status !== task.status) {
      activityDetails = `Task "${updatedTask.title}" status changed from ${task.status} to ${status}`;
      
      // 🔔 Notify assignee about status change
      if (task.assigneeId && task.assigneeId !== req.user.id) {
        await createNotification(
          task.assigneeId,
          'STATUS_CHANGED',
          `Task "${task.title}" status changed to ${status}`,
          `/projects/${task.projectId}`
        );
      }
    }

    await prisma.taskActivity.create({
      data: {
        action: 'UPDATED',
        details: activityDetails,
        taskId: task.id,
        userId: req.user.id,
      },
    });

    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    await prisma.task.delete({
      where: { id },
    });

    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Add comment
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const comment = await prisma.taskComment.create({
      data: {
        content,
        taskId: id,
        userId: req.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await prisma.taskActivity.create({
      data: {
        action: 'COMMENTED',
        details: `Comment added to task "${task.title}"`,
        taskId: task.id,
        userId: req.user.id,
      },
    });

    // 🔔 Notify assignee about comment
    if (task.assigneeId && task.assigneeId !== req.user.id) {
      await createNotification(
        task.assigneeId,
        'COMMENT_ADDED',
        `New comment on task "${task.title}"`,
        `/projects/${task.projectId}`
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get task comments
const getTaskComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await prisma.taskComment.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get task activities
const getTaskActivities = async (req, res) => {
  try {
    const { id } = req.params;

    const activities = await prisma.taskActivity.findMany({
      where: { taskId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  createTask,
  getProjectTasks,
  getAllTasks,
  updateTask,
  deleteTask,
  addComment,
  getTaskComments,
  getTaskActivities,
};