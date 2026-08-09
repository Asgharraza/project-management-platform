const prisma = require('../../prisma-client');
const { createNotification } = require('./notificationController');

// Create a new project (Manager/Admin only)
const createProject = async (req, res) => {
  try {
    const { name, description, priority, startDate, endDate, teamMemberIds } = req.body;

    // Only ADMIN and PROJECT_MANAGER can create projects
    if (req.user.role === 'TEAM_MEMBER') {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        managerId: req.user.id,
        members: {
          create: [
            // Add manager as a member
            {
              userId: req.user.id,
              role: 'LEAD',
            },
            // Add team members if provided
            ...(teamMemberIds || []).map((userId) => ({
              userId,
              role: 'MEMBER',
            })),
          ],
        },
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: true,
      },
    });

    // 🔔 Send notifications to all team members added
    if (teamMemberIds && teamMemberIds.length > 0) {
      for (const userId of teamMemberIds) {
        await createNotification(
          userId,
          'PROJECT_ADDED',
          `You have been added to project "${name}" by ${req.user.name}`,
          `/projects/${project.id}`
        );
      }
    }

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get all projects (with filters)
const getProjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    // Build where clause
    let where = {};
    
    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search by name or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // If user is TEAM_MEMBER, only show projects they're in
    if (req.user.role === 'TEAM_MEMBER') {
      where.members = {
        some: {
          userId: req.user.id,
        },
      };
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        chatMessages: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check if user has access to this project
    if (req.user.role === 'TEAM_MEMBER') {
      const isMember = project.members.some((m) => m.userId === req.user.id);
      if (!isMember) {
        return res.status(403).json({ error: 'You do not have access to this project.' });
      }
    }

    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Update project (Manager/Admin only)
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, priority, startDate, endDate } = req.body;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check permissions
    if (req.user.role === 'TEAM_MEMBER') {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    if (req.user.role === 'PROJECT_MANAGER' && project.managerId !== req.user.id) {
      return res.status(403).json({ error: 'You are not the manager of this project.' });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        status,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // 🔔 Notify all members about project update
    if (project.members && project.members.length > 0) {
      for (const member of project.members) {
        if (member.userId !== req.user.id) {
          await createNotification(
            member.userId,
            'STATUS_CHANGED',
            `Project "${name}" has been updated by ${req.user.name}`,
            `/projects/${id}`
          );
        }
      }
    }

    res.json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Delete project (Admin only)
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Only Admin can delete projects
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete projects.' });
    }

    await prisma.project.delete({
      where: { id },
    });

    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Add member to project (Manager/Admin only)
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check permissions
    if (req.user.role === 'TEAM_MEMBER') {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    if (req.user.role === 'PROJECT_MANAGER' && project.managerId !== req.user.id) {
      return res.status(403).json({ error: 'You are not the manager of this project.' });
    }

    // Check if user already in project
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: id,
        userId,
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this project.' });
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId,
        role: role || 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 🔔 SEND NOTIFICATION TO THE NEW MEMBER
    await createNotification(
      userId,
      'PROJECT_ADDED',
      `You have been added to project "${project.name}" by ${req.user.name}`,
      `/projects/${id}`
    );

    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Remove member from project
const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check permissions
    if (req.user.role === 'TEAM_MEMBER') {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    if (req.user.role === 'PROJECT_MANAGER' && project.managerId !== req.user.id) {
      return res.status(403).json({ error: 'You are not the manager of this project.' });
    }

    await prisma.projectMember.delete({
      where: { id: memberId },
    });

    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
};