import Workspace from "../models/Workspace.js";
import Goal from "../models/Goal.js";

const goalTemplates = [
  {
    name: "Emergency Fund",
    targetAmount: 100000,
  },
  {
    name: "Buy a MacBook Pro",
    targetAmount: 180000,
  },
  {
    name: "Europe Trip",
    targetAmount: 250000,
  },
  {
    name: "Buy a Bike",
    targetAmount: 120000,
  },
  {
    name: "Car Down Payment",
    targetAmount: 500000,
  },
  {
    name: "Home Renovation",
    targetAmount: 300000,
  },
  {
    name: "Wedding Fund",
    targetAmount: 800000,
  },
  {
    name: "New Smartphone",
    targetAmount: 90000,
  },
];

const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const seedGoals = async () => {
  const workspaces = await Workspace.find({
    isDeleted: false,
  });

  let created = 0;

  for (const workspace of workspaces) {
    for (const template of goalTemplates) {
      const exists = await Goal.findOne({
        workspace: workspace._id,
        name: template.name,
      });

      if (exists) continue;

      const progress = random(10, 90);

      const currentAmount = Math.round(
        (template.targetAmount * progress) / 100
      );

      const targetDate = new Date();

      targetDate.setMonth(
        targetDate.getMonth() + random(3, 24)
      );

      await Goal.create({
        workspace: workspace._id,

        name: template.name,

        targetAmount: template.targetAmount,

        currentAmount,

        targetDate,

        status:
          progress >= 100
            ? "completed"
            : "active",
      });

      created++;
    }
  }

  console.log(`✅ Seeded ${created} goals.`);
};

export default seedGoals;