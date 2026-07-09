import Workspace from "../models/Workspace.js";
import Category from "../models/Category.js";
import Budget from "../models/Budget.js";

const defaultBudgets = {
  Food: 15000,
  Shopping: 10000,
  Transport: 8000,
  Bills: 12000,
  Entertainment: 6000,
  Health: 5000,
  Education: 10000,
  Travel: 15000,
};

const seedBudgets = async () => {
  const workspaces = await Workspace.find({
    isDeleted: false,
  });

  const categories = await Category.find({
    type: "expense",
    isDeleted: false,
  });

  let created = 0;

  const startDate = new Date();
  startDate.setDate(1);

  const endDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    0
  );

  for (const workspace of workspaces) {
    for (const category of categories) {
      if (!defaultBudgets[category.name]) {
        continue;
      }

      const exists = await Budget.findOne({
        workspace: workspace._id,
        category: category._id,
        startDate,
      });

      if (exists) {
        continue;
      }

      await Budget.create({
        workspace: workspace._id,
        category: category._id,
        name: `${category.name} Budget`,
        amount: defaultBudgets[category.name],
        spent: 0,
        startDate,
        endDate,
      });

      created++;
    }
  }

  console.log(`✅ Seeded ${created} budgets.`);
};

export default seedBudgets;