import { z } from "zod";

import {
    WORKSPACE_TYPES,
    WORKSPACE_ROLES,
    WORKSPACE_STATUS,
    WORKSPACE_COLORS,
    MEMBER_STATUS,
    USER_CURRENCIES,
} from "../constants/index.js";

import {
    objectId,
    paginationSchema,
    searchSchema,
    sortOrderSchema,
} from "./common.validator.js";

const ASSIGNABLE_ROLES = WORKSPACE_ROLES.filter(
    (role) => role !== "owner"
);

// ======================================================
// Create Workspace
// ======================================================

export const createWorkspaceSchema = z.object({
    body: z
        .object({
            name: z
                .string({
                    required_error: "Workspace name is required.",
                })
                .trim()
                .min(3, "Workspace name must be at least 3 characters.")
                .max(100, "Workspace name cannot exceed 100 characters."),

            description: z
                .string()
                .trim()
                .max(500, "Description cannot exceed 500 characters.")
                .optional(),

            type: z
                .enum(WORKSPACE_TYPES, {
                    errorMap: () => ({
                        message: "Invalid workspace type.",
                    }),
                })
                .optional(),

            currency: z
                .string()
                .trim()
                .toUpperCase()
                .pipe(
                    z.enum(USER_CURRENCIES, {
                        errorMap: () => ({
                            message: "Invalid currency.",
                        }),
                    })
                )
                .optional(),

            timezone: z
                .string()
                .trim()
                .max(100, "Timezone cannot exceed 100 characters.")
                .optional(),

            locale: z
                .string()
                .trim()
                .max(20, "Locale cannot exceed 20 characters.")
                .optional(),

            color: z
                .enum(WORKSPACE_COLORS, {
                    errorMap: () => ({
                        message: "Invalid workspace color.",
                    }),
                })
                .optional(),

            icon: z
                .string()
                .trim()
                .max(50, "Icon cannot exceed 50 characters.")
                .optional(),
        })
        .strict(),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Update Workspace
// ======================================================

export const updateWorkspaceSchema = z.object({
    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(3, "Workspace name must be at least 3 characters.")
                .max(100, "Workspace name cannot exceed 100 characters.")
                .optional(),

            description: z
                .string()
                .trim()
                .max(500, "Description cannot exceed 500 characters.")
                .optional(),

            currency: z
                .string()
                .trim()
                .toUpperCase()
                .pipe(
                    z.enum(USER_CURRENCIES, {
                        errorMap: () => ({
                            message: "Invalid currency.",
                        }),
                    })
                )
                .optional(),

            timezone: z
                .string()
                .trim()
                .max(100)
                .optional(),

            locale: z
                .string()
                .trim()
                .max(20)
                .optional(),

            color: z
                .enum(WORKSPACE_COLORS, {
                    errorMap: () => ({
                        message: "Invalid workspace color.",
                    }),
                })
                .optional(),

            icon: z
                .string()
                .trim()
                .max(50)
                .optional(),

            status: z
                .enum(WORKSPACE_STATUS, {
                    errorMap: () => ({
                        message: "Invalid workspace status.",
                    }),
                })
                .optional(),
        })
        .strict()
        .refine((data) => Object.keys(data).length > 0, {
            message:
                "At least one field must be provided for update.",
        }),

    params: z.object({
        workspaceId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Delete Workspace
// ======================================================

export const deleteWorkspaceSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        workspaceId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Single Workspace
// ======================================================

export const getWorkspaceSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        workspaceId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Workspaces
// ======================================================

export const getWorkspacesSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({}),

    query: paginationSchema
        .merge(searchSchema)
        .merge(sortOrderSchema)
        .extend({
            type: z.enum(WORKSPACE_TYPES).optional(),

            status: z.enum(WORKSPACE_STATUS).optional(),

            sortBy: z
                .enum([
                    "name",
                    "createdAt",
                    "updatedAt",
                    "type",
                ])
                .default("createdAt"),
        }),
});

// ======================================================
// Transfer Ownership
// ======================================================

export const transferOwnershipSchema = z.object({
    body: z
        .object({
            newOwnerId: objectId,
        })
        .strict(),

    params: z.object({
        workspaceId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Invite Member
// ======================================================

export const inviteMemberSchema = z.object({
    body: z
        .object({
            email: z
                .string({
                    required_error: "Email is required.",
                })
                .trim()
                .toLowerCase()
                .email("Please provide a valid email address."),

            role: z
                .enum(ASSIGNABLE_ROLES, {
                    errorMap: () => ({
                        message: "Invalid member role.",
                    }),
                })
                .optional(),

            message: z
                .string()
                .trim()
                .max(500, "Message cannot exceed 500 characters.")
                .optional(),
        })
        .strict(),

    params: z.object({
        workspaceId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Accept Invitation
// ======================================================

export const acceptInvitationSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        workspaceId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Update Member
// ======================================================

export const updateMemberSchema = z.object({
    body: z
        .object({
            role: z
                .enum(ASSIGNABLE_ROLES, {
                    errorMap: () => ({
                        message: "Invalid member role.",
                    }),
                })
                .optional(),

            status: z
                .enum(MEMBER_STATUS, {
                    errorMap: () => ({
                        message: "Invalid member status.",
                    }),
                })
                .optional(),

            permissions: z
                .array(z.string().trim())
                .optional(),
        })
        .strict()
        .refine((data) => Object.keys(data).length > 0, {
            message:
                "At least one field must be provided for update.",
        }),

    params: z.object({
        workspaceId: objectId,
        memberId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Remove Member
// ======================================================

export const removeMemberSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        workspaceId: objectId,
        memberId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Get Workspace Members
// ======================================================

export const getMembersSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        workspaceId: objectId,
    }),

    query: paginationSchema
        .merge(searchSchema)
        .merge(sortOrderSchema)
        .extend({
            role: z.enum(WORKSPACE_ROLES).optional(),

            status: z.enum(MEMBER_STATUS).optional(),

            sortBy: z
                .enum([
                    "role",
                    "status",
                    "joinedAt",
                    "createdAt",
                ])
                .default("createdAt"),
        }),
});

// ======================================================
// Invitation Token
// ======================================================

export const invitationTokenSchema = z.object({
    body: z.object({}).optional(),

    params: z.object({
        token: z
            .string({
                required_error:
                    "Invitation token is required.",
            })
            .trim()
            .min(10, "Invalid invitation token."),
    }),

    query: z.object({}),
});