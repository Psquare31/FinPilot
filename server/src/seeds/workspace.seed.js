import User from "../models/User.js";
import Workspace from "../models/Workspace.js";

const seedWorkspaces = async () => {
  const users = await User.find({
    isDeleted: false,
  });

  let created = 0;

  for (const user of users) {
    const existingWorkspace = await Workspace.findOne({
      owner: user._id,
      name: "Personal Workspace",
    });

    if (existingWorkspace) {
      continue;
    }

    await Workspace.create({
      name: "Personal Workspace",
      description: "Default personal workspace",
      owner: user._id,
      members: [
        {
          user: user._id,
          role: "owner",
        },
      ],
      currency: "INR",
      isDefault: true,
    });

    created++;
  }

  console.log(
    `✅ Seeded ${created} workspaces.`
  );
};

export default seedWorkspaces;