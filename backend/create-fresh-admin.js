const bcrypt = require('bcryptjs');
const prisma = require('./prisma-client');

async function createFreshAdmin() {
  try {
    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    console.log('🔑 Password hash created:', hashedPassword.substring(0, 30) + '...');
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
      },
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Name:', admin.name);
    console.log('🎭 Role:', admin.role);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ Admin already exists. Please run delete-admin.js first.');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

createFreshAdmin();