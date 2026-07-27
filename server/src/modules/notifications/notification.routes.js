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
} from "./notification.controller.js";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.js";

import {
  createNotificationSchema,
  getNotificationsSchema,
  getNotificationSchema,
  deleteNotificationSchema,
  markNotificationReadSchema,
} from "./notification.validation.js";

const router = Router();

router.use(requireAuth);

// Notifications
router.post(
  "/",
  validate(createNotificationSchema),
  createNotification
);

router.get(
  "/",
  validate(getNotificationsSchema),
  getNotifications
);

router.get("/summary", getNotificationSummary);

router.get("/unread-count", getUnreadCount);

router.patch("/read-all", markAllAsRead);

router.delete("/all", deleteAllNotifications);

router.get(
  "/:id",
  validate(getNotificationSchema),
  getNotificationById
);

router.patch(
  "/:id/read",
  validate(markNotificationReadSchema),
  markAsRead
);

router.delete(
  "/:id",
  validate(deleteNotificationSchema),
  deleteNotification
);

export default router;