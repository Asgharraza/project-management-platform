const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = new PrismaClient();
}

const prisma = globalForPrisma.prisma;

module.exports = prisma;