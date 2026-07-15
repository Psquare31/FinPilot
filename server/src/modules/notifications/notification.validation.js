import { z } from "zod";

import {
    NOTIFICATION_TYPES,
    NOTIFICATION_STATUS,
    NOTIFICATION_PRIORITIES,
    NOTIFICATION_CHANNELS,
} from "../../constants/index.js";

import {
    objectId,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    dateRangeRefinement,
    sortOrderSchema,
} from "../../validators/common.validator.js";

// ======================================================
// Create Notification
// ======================================================

export const createNotificationSchema = z.object({
    body: z.object({
        user: objectId,

        type: z.enum(NOTIFICATION_TYPES, {
            errorMap: () => ({
                message: "Invalid notification type.",
            }),
        }),

        title: z
            .string({
                required_error: "Notification title is required.",
            })
            .trim()
            .min(2, "Title must contain at least 2 characters.")
            .max(150, "Title cannot exceed 150 characters."),

        message: z
            .string({
                required_error: "Notification message is required.",
            })
            .trim()
            .min(2, "Message must contain at least 2 characters.")
            .max(1000, "Message cannot exceed 1000 characters."),

        priority: z
            .enum(NOTIFICATION_PRIORITIES)
            .optional(),

        channel: z
            .enum(NOTIFICATION_CHANNELS)
            .optional(),

        status: z
            .enum(NOTIFICATION_STATUS)
            .optional(),

        metadata: z
            .record(z.any())
            .optional(),

        actionUrl: z
            .string()
            .trim()
            .url("Action URL must be a valid URL.")
            .optional(),

        expiresAt: z
            .coerce
            .date()
            .optional(),
    }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Update Notification
// ======================================================

export const updateNotificationSchema = z.object({
    body: z
        .object({
            title: z
                .string()
                .trim()
                .min(2)
                .max(150)
                .optional(),

            message: z
                .string()
                .trim()
                .max(1000)
                .optional(),

            priority: z
                .enum(NOTIFICATION_PRIORITIES)
                .optional(),

            channel: z
                .enum(NOTIFICATION_CHANNELS)
                .optional(),

            status: z
                .enum(NOTIFICATION_STATUS)
                .optional(),

            metadata: z
                .record(z.any())
                .optional(),

            actionUrl: z
                .string()
                .trim()
                .url()
                .optional(),

            expiresAt: z
                .coerce
                .date()
                .nullable()
                .optional(),

            readAt: z
                .coerce
                .date()
                .nullable()
                .optional(),
        })
        .refine(
            (data) => Object.keys(data).length > 0,
            {
                message:
                    "At least one field must be provided for update.",
            }
        ),

    params: z.object({
        notificationId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Delete Notification
// ======================================================

export const deleteNotificationSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        notificationId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Notification
// ======================================================

export const getNotificationSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        notificationId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Notifications
// ======================================================

export const getNotificationsSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: paginationSchema
        .merge(searchSchema)
        .merge(dateRangeSchema)
        .merge(sortOrderSchema)
        .extend({
            user: objectId.optional(),

            type: z
                .enum(NOTIFICATION_TYPES)
                .optional(),

            status: z
                .enum(NOTIFICATION_STATUS)
                .optional(),

            priority: z
                .enum(NOTIFICATION_PRIORITIES)
                .optional(),

            channel: z
                .enum(NOTIFICATION_CHANNELS)
                .optional(),

            sortBy: z
                .enum([
                    "createdAt",
                    "updatedAt",
                    "priority",
                    "status",
                    "expiresAt",
                ])
                .default("createdAt"),
        })
        .superRefine(dateRangeRefinement),
});

// ======================================================
// Mark Notification as Read
// ======================================================

export const markNotificationReadSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        notificationId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Mark Notification as Unread
// ======================================================

export const markNotificationUnreadSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        notificationId: objectId,
    }),

    query: z.object({}),
});