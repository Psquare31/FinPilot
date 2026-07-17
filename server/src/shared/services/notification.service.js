import BaseService from "./base.service.js";

import Notification from "../../models/Notification.js";

class NotificationService extends BaseService {
  constructor() {
    super(Notification);
  }

  // Create Notification
  async createNotification(payload) {
    return this.create(payload);
  }

  // Get Notifications
  async getNotifications(userId, query = {}) {
    const {
      page = 1,
      limit = 20,
      type,
      read,
    } = query;

    const filter = {
      user: userId,
      isDeleted: false,
    };

    if (type) {
      filter.type = type;
    }

    if (read !== undefined) {
      filter.isRead = read === "true";
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-createdAt",
    });
  }

  // Get Notification by ID
  async getNotificationById(id) {
    return this.findById(id);
  }

  // Mark Notification as Read
  async markAsRead(id) {
    return this.updateById(id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  // Mark All Notifications as Read
  async markAllAsRead(userId) {
    await Notification.updateMany(
      {
        user: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return {
      success: true,
    };
  }

  // Delete Notification
  async deleteNotification(id) {
    return this.deleteById(id);
  }

  // Delete All Notifications
  async deleteAllNotifications(userId) {
    const result = await Notification.deleteMany({
      user: userId,
    });

    return {
      deletedCount: result.deletedCount,
    };
  }

  // Get Unread Count
  async getUnreadCount(userId) {
    const count = await Notification.countDocuments({
      user: userId,
      isRead: false,
      isDeleted: false,
    });

    return {
      unread: count,
    };
  }

  // Get Notification Summary
  async getNotificationSummary(userId) {
    const [total, unread] = await Promise.all([
      Notification.countDocuments({
        user: userId,
        isDeleted: false,
      }),
      Notification.countDocuments({
        user: userId,
        isRead: false,
        isDeleted: false,
      }),
    ]);

    return {
      total,
      unread,
      read: total - unread,
    };
  }
}

export default new NotificationService();