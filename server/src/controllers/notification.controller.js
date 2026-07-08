import notificationService from "../services/notification.service.js";

import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create Notification
export const createNotification = asyncHandler(async (req, res) => {
  const notification =
    await notificationService.createNotification(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      notification,
      "Notification created successfully."
    )
  );
});

// Get Notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications =
    await notificationService.getNotifications(
      req.user._id,
      req.query
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      notifications,
      "Notifications fetched successfully."
    )
  );
});

// Get Notification by ID
export const getNotificationById = asyncHandler(async (req, res) => {
  const notification =
    await notificationService.getNotificationById(
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      notification,
      "Notification fetched successfully."
    )
  );
});

// Mark Notification as Read
export const markAsRead = asyncHandler(async (req, res) => {
  const notification =
    await notificationService.markAsRead(
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      notification,
      "Notification marked as read successfully."
    )
  );
});

// Mark All Notifications as Read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const result =
    await notificationService.markAllAsRead(
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "All notifications marked as read successfully."
    )
  );
});

// Delete Notification
export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Notification deleted successfully."
    )
  );
});

// Delete All Notifications
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const result =
    await notificationService.deleteAllNotifications(
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      result,
      "All notifications deleted successfully."
    )
  );
});

// Get Unread Count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count =
    await notificationService.getUnreadCount(
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      count,
      "Unread notification count fetched successfully."
    )
  );
});

// Get Notification Summary
export const getNotificationSummary = asyncHandler(async (req, res) => {
  const summary =
    await notificationService.getNotificationSummary(
      req.user._id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Notification summary fetched successfully."
    )
  );
});