
const prisma = require('./prisma-client');

async function deleteAdmin() {
  try {
    await prisma.user.delete({
      where: { email: 'admin@example.com' },
    });
    console.log('✅ Admin user deleted.');
  } catch (error) {
    if (error.code === 'P2025') {
      console.log('ℹ️ Admin user not found.');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

deleteAdmin();