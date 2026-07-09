import Workspace from "../models/Workspace.js";
import Investment from "../models/Investment.js";

const investmentTemplates = [
  {
    name: "Nifty 50 ETF",
    symbol: "NIFTYBEES",
    type: "etf",
  },
  {
    name: "SBI Large Cap Fund",
    symbol: "SBILCF",
    type: "mutual_fund",
  },
  {
    name: "HDFC Mid Cap Fund",
    symbol: "HDFCMID",
    type: "mutual_fund",
  },
  {
    name: "Reliance Industries",
    symbol: "RELIANCE",
    type: "stock",
  },
  {
    name: "TCS",
    symbol: "TCS",
    type: "stock",
  },
  {
    name: "Infosys",
    symbol: "INFY",
    type: "stock",
  },
  {
    name: "Gold ETF",
    symbol: "GOLDBEES",
    type: "etf",
  },
  {
    name: "Bitcoin",
    symbol: "BTC",
    type: "crypto",
  },
  {
    name: "Ethereum",
    symbol: "ETH",
    type: "crypto",
  },
];

const random = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const seedInvestments = async () => {
  const workspaces = await Workspace.find({
    isDeleted: false,
  });

  let created = 0;

  for (const workspace of workspaces) {
    for (const template of investmentTemplates) {
      const exists = await Investment.findOne({
        workspace: workspace._id,
        symbol: template.symbol,
      });

      if (exists) continue;

      const quantity = random(5, 100);

      const buyPrice = random(100, 3000);

      const currentPrice = Math.round(
        buyPrice * (0.8 + Math.random() * 0.6)
      );

      const investedAmount =
        quantity * buyPrice;

      const currentValue =
        quantity * currentPrice;

      const profitLoss =
        currentValue - investedAmount;

      await Investment.create({
        workspace: workspace._id,

        name: template.name,

        symbol: template.symbol,

        type: template.type,

        quantity,

        buyPrice,

        currentPrice,

        investedAmount,

        currentValue,

        profitLoss,

        purchaseDate: new Date(
          Date.now() -
            random(30, 730) *
              24 *
              60 *
              60 *
              1000
        ),

        status: "active",
      });

      created++;
    }
  }

  console.log(
    `✅ Seeded ${created} investments.`
  );
};

export default seedInvestments;