import connectDB from "../config/database/connectDB.js";

import seedUsers from "./users.seed.js";
import seedWorkspaces from "./workspaces.seed.js";
import seedCategories from "./categories.seed.js";
import seedAccounts from "./accounts.seed.js";
import seedTransactions from "./transactions.seed.js";
import seedBudgets from "./budgets.seed.js";
import seedGoals from "./goals.seed.js";
import seedInvestments from "./investments.seed.js";
import seedDebts from "./debts.seed.js";
import seedNotifications from "./notifications.seed.js";

const seed = async () => {
  try {
    await connectDB();

    console.log("🌱 Starting database seeding...\n");

    await seedUsers();

    await seedWorkspaces();

    await seedCategories();

    await seedAccounts();

    await seedTransactions();

    await seedBudgets();

    await seedGoals();

    await seedInvestments();

    await seedDebts();

    await seedNotifications();

    console.log("\n✅ Database seeded successfully.");

    process.exit(0);
  } catch (error) {
    console.error(error);

    process.exit(1);
  }
};

seed();