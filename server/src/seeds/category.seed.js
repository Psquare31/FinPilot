import Category from "../models/Category.js";

const defaultCategories = [
  // Income
  {
    name: "Salary",
    type: "income",
    icon: "Wallet",
    color: "#22C55E",
    isDefault: true,
  },
  {
    name: "Freelancing",
    type: "income",
    icon: "Laptop",
    color: "#10B981",
    isDefault: true,
  },
  {
    name: "Investments",
    type: "income",
    icon: "TrendingUp",
    color: "#16A34A",
    isDefault: true,
  },
  {
    name: "Interest",
    type: "income",
    icon: "PiggyBank",
    color: "#4ADE80",
    isDefault: true,
  },

  // Expense
  {
    name: "Food",
    type: "expense",
    icon: "Utensils",
    color: "#EF4444",
    isDefault: true,
  },
  {
    name: "Shopping",
    type: "expense",
    icon: "ShoppingBag",
    color: "#F97316",
    isDefault: true,
  },
  {
    name: "Transport",
    type: "expense",
    icon: "Car",
    color: "#3B82F6",
    isDefault: true,
  },
  {
    name: "Bills",
    type: "expense",
    icon: "Receipt",
    color: "#E11D48",
    isDefault: true,
  },
  {
    name: "Entertainment",
    type: "expense",
    icon: "Film",
    color: "#A855F7",
    isDefault: true,
  },
  {
    name: "Health",
    type: "expense",
    icon: "HeartPulse",
    color: "#EC4899",
    isDefault: true,
  },
  {
    name: "Education",
    type: "expense",
    icon: "GraduationCap",
    color: "#14B8A6",
    isDefault: true,
  },
  {
    name: "Travel",
    type: "expense",
    icon: "Plane",
    color: "#0EA5E9",
    isDefault: true,
  },
];

const seedCategories = async () => {
  await Category.deleteMany({
    isDefault: true,
  });

  await Category.insertMany(defaultCategories);

  console.log(
    `✅ Seeded ${defaultCategories.length} default categories.`
  );
};

export default seedCategories;