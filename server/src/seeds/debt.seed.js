import Workspace from "../models/Workspace.js";
import Debt from "../models/Debt.js";

const debtTemplates = [
  {
    name: "Home Loan",
    type: "home_loan",
    principalAmount: 3500000,
    interestRate: 8.5,
    tenureMonths: 240,
  },
  {
    name: "Car Loan",
    type: "car_loan",
    principalAmount: 800000,
    interestRate: 9.2,
    tenureMonths: 60,
  },
  {
    name: "Education Loan",
    type: "education_loan",
    principalAmount: 600000,
    interestRate: 8.8,
    tenureMonths: 84,
  },
  {
    name: "Personal Loan",
    type: "personal_loan",
    principalAmount: 250000,
    interestRate: 12.5,
    tenureMonths: 36,
  },
  {
    name: "Credit Card",
    type: "credit_card",
    principalAmount: 100000,
    interestRate: 36,
    tenureMonths: 12,
  },
];

const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const seedDebts = async () => {
  const workspaces = await Workspace.find({
    isDeleted: false,
  });

  let created = 0;

  for (const workspace of workspaces) {
    for (const debt of debtTemplates) {
      const exists = await Debt.findOne({
        workspace: workspace._id,
        name: debt.name,
      });

      if (exists) continue;

      const paid = random(
        debt.principalAmount * 0.1,
        debt.principalAmount * 0.8
      );

      const outstanding =
        debt.principalAmount - paid;

      const monthlyPayment = Math.round(
        outstanding / debt.tenureMonths
      );

      const dueDate = new Date();

      dueDate.setMonth(
        dueDate.getMonth() + random(1, 12)
      );

      await Debt.create({
        workspace: workspace._id,

        name: debt.name,

        type: debt.type,

        principalAmount: debt.principalAmount,

        outstandingAmount: outstanding,

        interestRate: debt.interestRate,

        monthlyPayment,

        dueDate,

        status:
          outstanding <= 0
            ? "paid"
            : "active",
      });

      created++;
    }
  }

  console.log(`✅ Seeded ${created} debts.`);
};

export default seedDebts;