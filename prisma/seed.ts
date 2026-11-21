import "dotenv/config";
import {
  PrismaClient,
  Role,
  TaskStatus,
  Priority,
  ProjectStatus,
  StockType,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();
const PASSWORD = "Password123!";

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

async function main() {
  console.log("Cleaning old data...");
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.progressReport.deleteMany();
  await prisma.stockHistory.deleteMany();
  await prisma.materialRequest.deleteMany();
  await prisma.material.deleteMany();
  await prisma.materialCategory.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.taskHistory.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectContractor.deleteMany();
  await prisma.project.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hashPassword(PASSWORD);

  // ---------- Users (demo accounts for all 5 roles) ----------
  const mk = async (name: string, email: string, role: Role) => {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        emailVerified: true,
        phone: faker.phone.number(),
      },
    });
    await prisma.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: passwordHash,
      },
    });
    return user;
  };

  const admin = await mk("Admin User", "admin@buildtrack.com", Role.ADMIN);
  const pm = await mk(
    "Project Manager",
    "pm@buildtrack.com",
    Role.PROJECT_MANAGER,
  );
  const engineer = await mk(
    "Site Engineer",
    "engineer@buildtrack.com",
    Role.SITE_ENGINEER,
  );
  const finance = await mk(
    "Finance Manager",
    "finance@buildtrack.com",
    Role.FINANCE_MANAGER,
  );
  const contractorUser = await mk(
    "Demo Contractor",
    "contractor@buildtrack.com",
    Role.CONTRACTOR,
  );

  const extraPMs = [pm];
  for (let i = 0; i < 2; i++) {
    extraPMs.push(
      await mk(
        faker.person.fullName(),
        `pm${i + 2}@buildtrack.com`,
        Role.PROJECT_MANAGER,
      ),
    );
  }
  const engineers = [engineer];
  for (let i = 0; i < 4; i++) {
    engineers.push(
      await mk(
        faker.person.fullName(),
        `engineer${i + 2}@buildtrack.com`,
        Role.SITE_ENGINEER,
      ),
    );
  }

  // ---------- Contractors (20) ----------
  const contractors = [];
  for (let i = 0; i < 20; i++) {
    contractors.push(
      await prisma.contractor.create({
        data: {
          userId: i === 0 ? contractorUser.id : null,
          companyName: faker.company.name() + " Builders",
          contactName: faker.person.fullName(),
          email:
            i === 0
              ? "contractor@buildtrack.com.co"
              : faker.internet.email().toLowerCase(),
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          rating: Number(
            faker.number.float({ min: 2.5, max: 5, fractionDigits: 1 }),
          ),
          status: i % 10 === 9 ? "INACTIVE" : "ACTIVE",
        },
      }),
    );
  }

  // ---------- Expense categories ----------
  const catNames = [
    "Labor",
    "Materials",
    "Equipment",
    "Transport",
    "Permits",
    "Utilities",
    "Miscellaneous",
  ];
  const expCats = [];
  for (const name of catNames)
    expCats.push(await prisma.expenseCategory.create({ data: { name } }));

  // ---------- Material categories + materials (30) ----------
  const matCatNames = [
    "Cement & Concrete",
    "Steel",
    "Bricks & Blocks",
    "Electrical",
    "Plumbing",
    "Finishing",
  ];
  const matCats = [];
  for (const name of matCatNames)
    matCats.push(await prisma.materialCategory.create({ data: { name } }));

  const materialNames = [
    "Portland Cement",
    "Ready Mix Concrete",
    "Sand",
    "Gravel",
    "Rebar 10mm",
    "Rebar 16mm",
    "Steel Beam",
    "Red Brick",
    "Concrete Block",
    "Electrical Wire 2.5mm",
    "Electrical Conduit",
    "Switch Board",
    "PVC Pipe 4in",
    "PVC Pipe 2in",
    "Water Tank",
    "Floor Tile",
    "Wall Paint",
    "Primer",
    "Plywood Sheet",
    "Glass Panel",
    "Door Frame",
    "Window Frame",
    "Roofing Sheet",
    "Nails",
    "Bolts & Nuts",
    "Waterproofing Membrane",
    "Insulation Foam",
    "Gypsum Board",
    "Circuit Breaker",
    "LED Light Fixture",
  ];
  const units = ["bag", "kg", "pcs", "m", "ton", "sheet"];
  const materials = [];
  for (let i = 0; i < materialNames.length; i++) {
    materials.push(
      await prisma.material.create({
        data: {
          name: materialNames[i],
          sku: `MAT-${String(i + 1).padStart(4, "0")}`,
          categoryId: matCats[i % matCats.length].id,
          unit: pick(units),
          availableQuantity: faker.number.int({ min: 5, max: 500 }),
          lowStockThreshold: 20,
          unitPrice: faker.number.int({ min: 50, max: 5000 }),
        },
      }),
    );
  }

  // ---------- Projects (10) + Tasks (100) ----------
  const statuses: ProjectStatus[] = [
    "ACTIVE",
    "ACTIVE",
    "ACTIVE",
    "PLANNING",
    "COMPLETED",
    "ON_HOLD",
  ];
  const taskTitles = [
    "Site survey",
    "Excavation",
    "Foundation work",
    "Rebar installation",
    "Concrete pouring",
    "Column construction",
    "Brick masonry",
    "Roof slab",
    "Electrical wiring",
    "Plumbing installation",
    "Plastering",
    "Flooring",
    "Painting",
    "Window fitting",
    "Final inspection",
  ];
  const taskStatuses: TaskStatus[] = [
    "TODO",
    "IN_PROGRESS",
    "REVIEW",
    "COMPLETED",
  ];
  const priorities: Priority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

  const projects = [];
  for (let p = 0; p < 10; p++) {
    const start = faker.date.past({ years: 1 });
    const end = new Date(
      start.getTime() + faker.number.int({ min: 120, max: 400 }) * 86400000,
    );
    const project = await prisma.project.create({
      data: {
        name: `${faker.location.city()} ${pick(["Tower", "Mall", "Bridge", "Apartment Complex", "Hospital", "School"])}`,
        description: faker.lorem.sentences(2),
        location: `${faker.location.streetAddress()}, ${faker.location.city()}`,
        startDate: start,
        expectedEndDate: end,
        totalBudget: faker.number.int({ min: 500000, max: 5000000 }),
        status: statuses[p % statuses.length],
        progress: faker.number.int({ min: 5, max: 95 }),
        managerId: pick(extraPMs).id,
      },
    });
    projects.push(project);

    // assign 3-5 contractors to the project
    const assigned = faker.helpers.arrayElements(
      contractors,
      faker.number.int({ min: 3, max: 5 }),
    );
    // make sure the demo contractor is assigned to the first 3 projects
    if (p < 3 && !assigned.find((c) => c.id === contractors[0].id))
      assigned.push(contractors[0]);
    await prisma.projectContractor.createMany({
      data: assigned.map((c) => ({
        projectId: project.id,
        contractorId: c.id,
      })),
    });

    // milestones
    await prisma.milestone.createMany({
      data: [
        "Foundation Complete",
        "Structure Complete",
        "Finishing Complete",
      ].map((title, i) => ({
        projectId: project.id,
        title,
        dueDate: new Date(
          start.getTime() + ((i + 1) * (end.getTime() - start.getTime())) / 3,
        ),
        completed: i === 0,
        completedAt: i === 0 ? new Date() : null,
      })),
    });

    // 10 tasks per project
    const createdTasks = [];
    for (let t = 0; t < 10; t++) {
      const status = pick(taskStatuses);
      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: `${taskTitles[t % taskTitles.length]} - ${project.name.split(" ")[0]}`,
          description: faker.lorem.sentence(),
          status,
          priority: pick(priorities),
          progress:
            status === "COMPLETED"
              ? 100
              : status === "TODO"
                ? 0
                : faker.number.int({ min: 10, max: 90 }),
          deadline: faker.date.between({
            from: new Date(Date.now() - 30 * 86400000),
            to: new Date(Date.now() + 90 * 86400000),
          }),
          assigneeId: pick(engineers).id,
          contractorId: pick(assigned).id,
        },
      });
      createdTasks.push(task);

      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          userId: pm.id,
          action: "Task created",
          toStatus: "TODO",
        },
      });

      // dependency: depends on the previous task (never on itself)
      if (t > 0 && Math.random() < 0.4) {
        await prisma.taskDependency.create({
          data: { taskId: task.id, dependsOnTaskId: createdTasks[t - 1].id },
        });
      }
    }

    // progress reports
    for (let r = 0; r < 3; r++) {
      await prisma.progressReport.create({
        data: {
          projectId: project.id,
          taskId: pick(createdTasks).id,
          progress: faker.number.int({ min: 10, max: 100 }),
          description: faker.lorem.sentences(2),
          photos: [],
          reportedById: pick(engineers).id,
        },
      });
    }
  }

  // ---------- Expenses (60) ----------
  for (let e = 0; e < 60; e++) {
    await prisma.expense.create({
      data: {
        title: faker.commerce.productName(),
        projectId: pick(projects).id,
        categoryId: pick(expCats).id,
        amount: faker.number.int({ min: 1000, max: 150000 }),
        date: faker.date.past({ years: 1 }),
        description: faker.lorem.sentence(),
        recordedById: finance.id,
      },
    });
  }

  // ---------- Material requests + stock history ----------
  for (const m of materials) {
    await prisma.stockHistory.create({
      data: {
        materialId: m.id,
        type: StockType.STOCK_IN,
        quantity: m.availableQuantity,
        balanceAfter: m.availableQuantity,
        note: "Initial stock",
        userId: admin.id,
      },
    });
  }
  for (let i = 0; i < 20; i++) {
    const project = pick(projects);
    await prisma.materialRequest.create({
      data: {
        materialId: pick(materials).id,
        projectId: project.id,
        contractorId: pick(contractors).id,
        requestedById: contractorUser.id,
        quantity: faker.number.int({ min: 1, max: 30 }),
        status: pick(["PENDING", "APPROVED", "REJECTED"] as const),
        note: faker.lorem.sentence(),
      },
    });
  }

  // ---------- Notification ----------
  await prisma.notification.create({
    data: {
      userId: pm.id,
      title: "Welcome",
      message: "BuildTrack seed data loaded.",
    },
  });

  console.log("Seed complete!");
  console.log("Demo login (password for all accounts): " + PASSWORD);
  console.log(
    "admin@buildtrack.com | pm@buildtrack.com | engineer@buildtrack.com | finance@buildtrack.com | contractor@buildtrack.com",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
