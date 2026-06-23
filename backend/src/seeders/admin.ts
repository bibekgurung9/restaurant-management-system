import bcrypt from "bcrypt";
import { PrismaClient, AdminRole } from "@prisma/client";

const prisma = new PrismaClient();

const admins = [
  {
    name: "Super Admin",
    email: "super@admin.com.np",
    password: "super123",
    role: AdminRole.SUPER_ADMIN,
  },
  {
    name: "Admin User",
    email: "admin@admin.com.np",
    password: "admin123",
    role: AdminRole.ADMIN,
  },
  {
    name: "Staff User",
    email: "staff@admin.com.np",
    password: "staff123",
    role: AdminRole.STAFF,
  },
  {
    name: "Cashier User",
    email: "cashier@admin.com.np",
    password: "cashier123",
    role: AdminRole.CASHIER,
  },
];

async function seedAdmins() {
  try {
    console.log("Seeding admin users...");

    for (const admin of admins) {
      const exists = await prisma.admin.findUnique({
        where: { email: admin.email },
      });

      if (exists) {
        console.log(`Skipping existing admin: ${admin.email}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(admin.password, 10);

      await prisma.admin.create({
        data: {
          name: admin.name,
          email: admin.email,
          password: hashedPassword,
          email_verified: true,
          phone_verified: true,
          role: admin.role,
        },
      });

      console.log(`Created admin: ${admin.email}`);
    }

    console.log("Admin seeding completed successfully.");
  } catch (error) {
    console.error("Error seeding admin data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmins();