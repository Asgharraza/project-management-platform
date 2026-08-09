const prisma = require('../../prisma-client');

// Get chat messages for a project
const getChatMessages = async (req, res) => {
  try {
    const { projectId } = req.params;

    const messages = await prisma.chatMessage.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: {
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
        createdAt: 'asc',
      },
    });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Send a chat message
const sendChatMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        projectId,
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

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

// Delete a chat message (own message or admin)
const deleteChatMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    // Only message owner or admin can delete
    if (message.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions.' });
    }

    await prisma.chatMessage.delete({
      where: { id: messageId },
    });

    res.json({ message: 'Message deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error.' });
  }
};

module.exports = {
  getChatMessages,
  sendChatMessage,
  deleteChatMessage,
};