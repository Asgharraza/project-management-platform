const prisma = require('./prisma-client');

async function testConnection() {
  try {
    console.log('🔄 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ Query test passed:', result);
    
    console.log('🎉 Database is ready!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error message:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testConnection();