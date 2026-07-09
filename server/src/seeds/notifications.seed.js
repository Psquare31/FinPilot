import Workspace from "../models/Workspace.js";
import Notification from "../models/Notification.js";

const notifications = [
  {
    title: "Welcome to FinPilot",
    message:
      "Your workspace has been created successfully.",
    type: "system",
  },
  {
    title: "Budget Reminder",
    message:
      "You have used 75% of your monthly budget.",
    type: "budget",
  },
  {
    title: "Investment Update",
    message:
      "Your portfolio gained 4.2% this month.",
    type: "investment",
  },
  {
    title: "Goal Progress",
    message:
      "You're halfway to completing your Emergency Fund goal.",
    type: "goal",
  },
];

const seedNotifications = async () => {
  const workspaces = await Workspace.find({
    isDeleted: false,
  });

  let created = 0;

  for (const workspace of workspaces) {
    for (const item of notifications) {
      await Notification.create({
        workspace: workspace._id,

        title: item.title,

        message: item.message,

        type: item.type,

        isRead: false,
      });

      created++;
    }
  }

  console.log(
    `✅ Seeded ${created} notifications.`
  );
};

export default seedNotifications;