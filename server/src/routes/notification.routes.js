import { Router } from "express";

import {
  createNotification,
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  getNotificationSummary,
} from "../controllers/notification.controller.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.js";

import {
  createNotificationSchema,
} from "../validators/notification.validator.js";

const router = Router();

router.use(requireAuth);

// Notifications
router.post(
  "/",
  validate(createNotificationSchema),
  createNotification
);

router.get("/", getNotifications);

router.get("/summary", getNotificationSummary);

router.get("/unread-count", getUnreadCount);

router.patch("/read-all", markAllAsRead);

router.delete("/all", deleteAllNotifications);

router.get("/:id", getNotificationById);

router.patch("/:id/read", markAsRead);

router.delete("/:id", deleteNotification);

export default router;