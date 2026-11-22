import "dotenv/config";
import {
  PrismaClient,
  Role,
  TaskStatus,
  Priority,
  ProjectStatus,
  StockType,
  type Contractor,
  type ExpenseCategory,
  type MaterialCategory,
  type Material,
  type Project,
  type Task,
} from "@prisma/client";
import { faker } from "@faker-js/faker";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();
const PASSWORD = "Password123!";
const DAY = 86400000;

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
  const contractors: Contractor[] = [];
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
  const expCats: ExpenseCategory[] = [];
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
  const matCats: MaterialCategory[] = [];
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
  const materials: Material[] = [];
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

  const projectNames = [
    "Skyline Tower",
    "Riverside Mall",
    "Harbor Bridge",
    "Green Valley Apartments",
    "City General Hospital",
    "Lakeview School",
    "Central Metro Station",
    "Sunrise Business Park",
    "Eastgate Warehouse",
    "Grand Plaza Hotel",
  ];
  const cities = [
    "Dhaka",
    "Chattogram",
    "Sylhet",
    "Khulna",
    "Rajshahi",
    "Barishal",
    "Cumilla",
    "Gazipur",
    "Narayanganj",
    "Rangpur",
  ];

  const projects: Project[] = [];
  const allTasks: { id: string; projectId: string }[] = [];

  for (let p = 0; p < 10; p++) {
    const start = faker.date.past({ years: 1 });
    const end = new Date(
      start.getTime() + faker.number.int({ min: 120, max: 400 }) * DAY,
    );
    const pStatus = statuses[p % statuses.length];

    const project = await prisma.project.create({
      data: {
        name: projectNames[p],
        description: faker.lorem.sentences(2),
        location: `${faker.location.streetAddress()}, ${cities[p]}`,
        startDate: start,
        expectedEndDate: end,
        totalBudget: faker.number.int({ min: 500000, max: 5000000 }),
        status: pStatus,
        progress:
          pStatus === "COMPLETED"
            ? 100
            : pStatus === "PLANNING"
              ? faker.number.int({ min: 0, max: 10 })
              : faker.number.int({ min: 10, max: 90 }),
        managerId: extraPMs[p % extraPMs.length].id,
      },
    });
    projects.push(project);

    const assigned = faker.helpers.arrayElements(
      contractors,
      faker.number.int({ min: 3, max: 5 }),
    );
    if (p < 3 && !assigned.find((c) => c.id === contractors[0].id))
      assigned.push(contractors[0]);
    await prisma.projectContractor.createMany({
      data: assigned.map((c) => ({
        projectId: project.id,
        contractorId: c.id,
      })),
    });

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
        completed: pStatus === "COMPLETED" ? true : i === 0,
        completedAt: pStatus === "COMPLETED" || i === 0 ? new Date() : null,
      })),
    });

    const createdTasks: Task[] = [];
    for (let t = 0; t < 10; t++) {
      const status: TaskStatus =
        pStatus === "COMPLETED"
          ? "COMPLETED"
          : pStatus === "PLANNING"
            ? "TODO"
            : pick(taskStatuses);

      const task = await prisma.task.create({
        data: {
          projectId: project.id,
          title: `${taskTitles[t % taskTitles.length]} - ${project.name}`,
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
            from: new Date(Date.now() - 30 * DAY),
            to: new Date(Date.now() + 90 * DAY),
          }),
          assigneeId: pick(engineers).id,
          contractorId: pick(assigned).id,
        },
      });
      createdTasks.push(task);
      allTasks.push({ id: task.id, projectId: project.id });

      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          userId: pm.id,
          action: "Task created",
          toStatus: "TODO",
        },
      });
      const path: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"];
      const reached = path.slice(0, path.indexOf(status) + 1);
      for (let h = 1; h < reached.length; h++) {
        await prisma.taskHistory.create({
          data: {
            taskId: task.id,
            userId: pick(engineers).id,
            action: "Status changed",
            fromStatus: reached[h - 1],
            toStatus: reached[h],
            createdAt: new Date(Date.now() - (reached.length - h) * DAY),
          },
        });
      }

      if (t > 0 && Math.random() < 0.4) {
        await prisma.taskDependency.create({
          data: { taskId: task.id, dependsOnTaskId: createdTasks[t - 1].id },
        });
      }
    }

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

  // ---------- Task comments (40) ----------
  const commenters = [pm, ...engineers];
  for (let c = 0; c < 40; c++) {
    await prisma.taskComment.create({
      data: {
        taskId: pick(allTasks).id,
        userId: pick(commenters).id,
        content: faker.lorem.sentence(),
      },
    });
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

  // ---------- Stock history ----------
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

  // ---------- Material requests (20) ----------
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

  // ---------- Notifications ----------
  const notifyUsers = [admin, pm, engineer, finance, contractorUser];
  for (const u of notifyUsers) {
    await prisma.notification.createMany({
      data: [
        {
          userId: u.id,
          title: "Welcome to BuildTrack",
          message: "Your workspace is ready.",
        },
        {
          userId: u.id,
          title: "Seed data loaded",
          message: "Demo projects, tasks and expenses are available.",
        },
      ],
    });
  }

  // ---------- Activity logs ----------
  for (const project of projects) {
    await prisma.activityLog.create({
      data: {
        userId: admin.id,
        action: "CREATE",
        entity: "Project",
        entityId: project.id,
      },
    });
  }

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
