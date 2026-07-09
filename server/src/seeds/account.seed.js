import Workspace from "../models/Workspace.js";
import Account from "../models/Account.js";

const defaultAccounts = [
  {
    name: "Cash",
    type: "cash",
    balance: 10000,
    color: "#22C55E",
    icon: "Wallet",
  },
  {
    name: "Savings Account",
    type: "bank",
    balance: 50000,
    color: "#3B82F6",
    icon: "Landmark",
  },
  {
    name: "Credit Card",
    type: "credit",
    balance: 0,
    color: "#EF4444",
    icon: "CreditCard",
  },
  {
    name: "UPI Wallet",
    type: "wallet",
    balance: 5000,
    color: "#A855F7",
    icon: "Smartphone",
  },
];

const seedAccounts = async () => {
  const workspaces = await Workspace.find({
    isDeleted: false,
  });

  let created = 0;

  for (const workspace of workspaces) {
    for (const account of defaultAccounts) {
      const exists = await Account.findOne({
        workspace: workspace._id,
        name: account.name,
      });

      if (exists) continue;

      await Account.create({
        ...account,
        workspace: workspace._id,
      });

      created++;
    }
  }

  console.log(`✅ Seeded ${created} accounts.`);
};

export default seedAccounts;