import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hostel.com',
      password: hashedPassword,
      role: 'ADMIN',
      admin: {
        create: {
          name: 'System Administrator'
        }
      }
    }
  })
  
  console.log('Admin user created:', adminUser.email)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })