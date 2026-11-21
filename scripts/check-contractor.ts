import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: "CONTRACTOR" },
    select: {
      id: true,
      email: true,
      role: true,
      contractor: { select: { id: true, companyName: true } },
    },
  });
  console.log("CONTRACTOR USERS:", JSON.stringify(users, null, 2));

  const demo = await prisma.user.findUnique({
    where: { email: "contractor@buildtrack.com" },
    include: { contractor: { include: { projects: true, tasks: true } } },
  });
  console.log("DEMO USER:", demo?.email, "role:", demo?.role);
  console.log("LINKED CONTRACTOR:", demo?.contractor?.id ?? "NONE");
  console.log("PROJECTS:", demo?.contractor?.projects.length ?? 0);
  console.log("TASKS:", demo?.contractor?.tasks.length ?? 0);
}

main().finally(() => prisma.$disconnect());
