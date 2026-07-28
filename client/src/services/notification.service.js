import { get, patch, del } from "./apiClient";

// listNotifications returns { data: [...], pagination }
export const listNotifications = async (params) => {
  const res = await get("/notifications", params);
  return res?.data || res || [];
};

export const getUnreadCount = async () => {
  const res = await get("/notifications/unread-count");
  return res?.unread || 0;
};

export const markNotificationRead = (id) => patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () => patch("/notifications/read-all");

export const deleteNotification = (id) => del(`/notifications/${id}`);
