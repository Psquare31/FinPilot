import connectDB from "../config/database/connectDB.js";

// Eight of these were imported under plural names that do not exist on disk
// (workspaces/categories/accounts/transactions/budgets/goals/investments/
// debts), so `npm run seed` failed at import and could never have run.
import seedUsers from "./users.seed.js";
import seedWorkspaces from "./workspace.seed.js";
import seedCategories from "./category.seed.js";
import seedAccounts from "./account.seed.js";
import seedTransactions from "./transaction.seed.js";
import seedBudgets from "./budget.seed.js";
import seedGoals from "./goal.seed.js";
import seedInvestments from "./investment.seed.js";
import seedDebts from "./debt.seed.js";
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