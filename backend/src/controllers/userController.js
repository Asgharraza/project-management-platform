const bcrypt = require('bcryptjs');
const prisma = require('../../prisma-client');

// Get all users (Admin only)
const getUsers = async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Get user by ID (Admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Update user profile (self)
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId },
        },
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use.' });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        email: email || undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Update user password (self)
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Update user role (Admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role.' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Reset user password (Admin only)
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent resetting own password via this endpoint (use settings page)
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Use settings page to change your own password.' });
    }

    // Generate a default password if not provided
    const password = newPassword || 'Temp@123';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ 
      message: 'Password reset successfully.',
      newPassword: password,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};


// Delete user (Admin only) - Complete cleanup
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }

    console.log(`🗑️ Deleting user: ${user.email} (${user.id})`);

    // 1. Reassign tasks assigned to this user
    await prisma.task.updateMany({
      where: { assigneeId: id },
      data: { assigneeId: req.user.id },
    });
    console.log('✅ Tasks reassigned');

    // 2. Reassign projects they manage
    await prisma.project.updateMany({
      where: { managerId: id },
      data: { managerId: req.user.id },
    });
    console.log('✅ Projects reassigned');

    // 3. Delete project memberships
    await prisma.projectMember.deleteMany({
      where: { userId: id },
    });
    console.log('✅ Project memberships removed');

    // 4. Delete task comments
    await prisma.taskComment.deleteMany({
      where: { userId: id },
    });
    console.log('✅ Task comments removed');

    // 5. Delete task activities
    await prisma.taskActivity.deleteMany({
      where: { userId: id },
    });
    console.log('✅ Task activities removed');

    // 6. Delete task attachments
    await prisma.taskAttachment.deleteMany({
      where: { userId: id },
    });
    console.log('✅ Task attachments removed');

    // 7. Delete chat messages
    await prisma.chatMessage.deleteMany({
      where: { userId: id },
    });
    console.log('✅ Chat messages removed');

    // 8. Delete chat attachments
    await prisma.chatAttachment.deleteMany({
      where: { userId: id },
    });
    console.log('✅ Chat attachments removed');

    // 9. Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: id },
    });
    console.log('✅ Notifications removed');

    // 10. Finally delete the user
    await prisma.user.delete({
      where: { id },
    });
    console.log('✅ User deleted successfully');

    res.json({ 
      message: 'User deleted successfully. All related records were cleaned up.',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user.',
      details: error.message 
    });
  }
};



module.exports = {
  getUsers,
  getUserById,
  updateProfile,
  updatePassword,
  updateUserRole,
  resetUserPassword,
  deleteUser,
}; 