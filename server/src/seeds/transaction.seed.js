import Account from "../models/Account.js";
import Category from "../models/Category.js";
import Transaction from "../models/Transaction.js";

const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomDate = () => {
  const today = new Date();

  const past = new Date();

  past.setMonth(today.getMonth() - 12);

  return new Date(
    past.getTime() +
      Math.random() *
        (today.getTime() - past.getTime())
  );
};

const seedTransactions = async () => {
  const accounts = await Account.find({
    isDeleted: false,
  });

  const incomeCategories =
    await Category.find({
      type: "income",
      isDeleted: false,
    });

  const expenseCategories =
    await Category.find({
      type: "expense",
      isDeleted: false,
    });

  let transactions = [];

  for (const account of accounts) {
    for (let i = 0; i < 100; i++) {
      const isIncome = Math.random() < 0.3;

      const category = isIncome
        ? incomeCategories[
            random(
              0,
              incomeCategories.length - 1
            )
          ]
        : expenseCategories[
            random(
              0,
              expenseCategories.length - 1
            )
          ];

      const amount = isIncome
        ? random(5000, 50000)
        : random(100, 5000);

      transactions.push({
        workspace: account.workspace,

        account: account._id,

        category: category._id,

        amount,

        type: isIncome
          ? "income"
          : "expense",

        description: `${category.name} Transaction`,

        transactionDate: randomDate(),
      });

      if (isIncome) {
        account.balance += amount;
      } else {
        account.balance -= amount;
      }
    }

    await account.save();
  }

  await Transaction.insertMany(transactions);

  console.log(
    `✅ Seeded ${transactions.length} transactions.`
  );
};

export default seedTransactions;