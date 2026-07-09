import User from "../models/User.js";

const users = [
  {
    clerkId: "demo-user-1",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe",
    imageUrl: "",
  },
  {
    clerkId: "demo-user-2",
    email: "jane@example.com",
    firstName: "Jane",
    lastName: "Smith",
    fullName: "Jane Smith",
    imageUrl: "",
  },
];

const seedUsers = async () => {
  await User.deleteMany({
    clerkId: {
      $in: users.map((u) => u.clerkId),
    },
  });

  await User.insertMany(users);

  console.log(`✅ Seeded ${users.length} users.`);
};

export default seedUsers;