import { PrismaClient, Category } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@1234";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // --- Citizen ---
  const citizen = await prisma.user.upsert({
    where: { email: "citizen@demo.local" },
    update: {},
    create: {
      name: "Demo Citizen",
      email: "citizen@demo.local",
      phone: "9990000001",
      passwordHash,
      role: "CITIZEN",
      district: "Ranchi",
    },
  });

  // --- Admin ---
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo.local" },
    update: {},
    create: {
      name: "Demo Admin",
      email: "admin@demo.local",
      phone: "9990000002",
      passwordHash,
      role: "ADMIN",
    },
  });

  // --- Partners (4, each covering a cluster of the 8 fixed domains) ---
  const partnerDefs: {
    email: string;
    phone: string;
    orgName: string;
    type: "UNIVERSITY" | "INDUSTRY";
    domains: Category[];
  }[] = [
    {
      email: "partner1@demo.local",
      phone: "9990000003",
      orgName: "Jharkhand State University",
      type: "UNIVERSITY",
      domains: ["EDUCATION", "PUBLIC_ADMIN"],
    },
    {
      email: "partner2@demo.local",
      phone: "9990000004",
      orgName: "AgriTech Industries Ltd",
      type: "INDUSTRY",
      domains: ["AGRICULTURE", "ENVIRONMENT"],
    },
    {
      email: "partner3@demo.local",
      phone: "9990000005",
      orgName: "Ranchi Institute of Health Sciences",
      type: "UNIVERSITY",
      domains: ["HEALTHCARE", "WATER"],
    },
    {
      email: "partner4@demo.local",
      phone: "9990000006",
      orgName: "Urban Energy Solutions",
      type: "INDUSTRY",
      domains: ["ENERGY", "URBAN_DEVELOPMENT"],
    },
  ];

  for (const p of partnerDefs) {
    const partnerUser = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        name: p.orgName,
        email: p.email,
        phone: p.phone,
        passwordHash,
        role: "PARTNER",
      },
    });

    await prisma.partner.upsert({
      where: { userId: partnerUser.id },
      update: {},
      create: {
        userId: partnerUser.id,
        orgName: p.orgName,
        type: p.type,
        domains: p.domains,
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  Citizen: citizen@demo.local / ${DEMO_PASSWORD}`);
  console.log(`  Admin:   admin@demo.local / ${DEMO_PASSWORD}`);
  console.log(`  Partners: partner1..4@demo.local / ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
