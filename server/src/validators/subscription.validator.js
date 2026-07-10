import { z } from "zod";

import {
    SUBSCRIPTION_STATUS,
    BILLING_CYCLES,
    PAYMENT_METHODS,
} from "../constants/index.js";

import {
    objectId,
    moneySchema,
    paginationSchema,
    searchSchema,
    dateRangeSchema,
    dateRangeRefinement,
    sortOrderSchema,
} from "./common.validator.js";

// ======================================================
// Razorpay Schema
// ======================================================

const razorpaySchema = z.object({
    orderId: z
        .string()
        .trim()
        .optional(),

    paymentId: z
        .string()
        .trim()
        .optional(),

    subscriptionId: z
        .string()
        .trim()
        .optional(),

    customerId: z
        .string()
        .trim()
        .optional(),

    planId: z
        .string()
        .trim()
        .optional(),
});

// ======================================================
// Logo Schema
// ======================================================

const logoSchema = z.object({
    publicId: z
        .string()
        .trim()
        .optional(),

    url: z
        .string()
        .url("Logo URL must be a valid URL.")
        .optional(),
});

// ======================================================
// Create Subscription
// ======================================================

export const createSubscriptionSchema = z.object({
    body: z
        .object({
            account: objectId,

            category: objectId,

            name: z
                .string({
                    required_error:
                        "Subscription name is required.",
                })
                .trim()
                .min(
                    2,
                    "Subscription name must be at least 2 characters."
                )
                .max(
                    100,
                    "Subscription name cannot exceed 100 characters."
                ),

            provider: z
                .string({
                    required_error:
                        "Provider name is required.",
                })
                .trim()
                .min(
                    2,
                    "Provider name must be at least 2 characters."
                )
                .max(
                    100,
                    "Provider name cannot exceed 100 characters."
                ),

            logo: logoSchema.optional(),

            razorpay: razorpaySchema.optional(),

            amount: moneySchema,

            billingCycle: z
                .enum(BILLING_CYCLES)
                .optional(),

            renewalType: z
                .enum([
                    "automatic",
                    "manual",
                ])
                .optional(),

            paymentMethod: z
                .enum(PAYMENT_METHODS)
                .optional(),

            autoPay: z
                .boolean()
                .optional(),

            reminderDays: z.coerce
                .number()
                .min(
                    0,
                    "Reminder days cannot be negative."
                )
                .max(
                    30,
                    "Reminder days cannot exceed 30."
                )
                .optional(),

            nextBillingDate: z.coerce.date(),

            lastBillingDate: z.coerce
                .date()
                .nullable()
                .optional(),

            isTrial: z
                .boolean()
                .optional(),

            trialEndsAt: z.coerce
                .date()
                .nullable()
                .optional(),

            status: z
                .enum(
                    SUBSCRIPTION_STATUS
                )
                .optional(),

            notes: z
                .string()
                .trim()
                .max(
                    500,
                    "Notes cannot exceed 500 characters."
                )
                .optional(),
        })
        .superRefine((data, ctx) => {
            if (
                data.lastBillingDate &&
                data.nextBillingDate <=
                    data.lastBillingDate
            ) {
                ctx.addIssue({
                    code:
                        z.ZodIssueCode.custom,
                    path: [
                        "nextBillingDate",
                    ],
                    message:
                        "Next billing date must be after the last billing date.",
                });
            }

            if (
                data.isTrial &&
                !data.trialEndsAt
            ) {
                ctx.addIssue({
                    code:
                        z.ZodIssueCode.custom,
                    path: [
                        "trialEndsAt",
                    ],
                    message:
                        "Trial end date is required when the subscription is a trial.",
                });
            }
        }),

    params: z.object({}),

    query: z.object({}),
});

// ======================================================
// Update Subscription
// ======================================================

export const updateSubscriptionSchema = z.object({
    body: z
        .object({
            account:
                objectId.optional(),

            category:
                objectId.optional(),

            name: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            provider: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            logo:
                logoSchema.optional(),

            razorpay:
                razorpaySchema.optional(),

            amount:
                moneySchema.optional(),

            billingCycle: z
                .enum(
                    BILLING_CYCLES
                )
                .optional(),

            renewalType: z
                .enum([
                    "automatic",
                    "manual",
                ])
                .optional(),

            paymentMethod: z
                .enum(
                    PAYMENT_METHODS
                )
                .optional(),

            autoPay: z
                .boolean()
                .optional(),

            reminderDays: z.coerce
                .number()
                .min(0)
                .max(30)
                .optional(),

            nextBillingDate:
                z.coerce
                    .date()
                    .optional(),

            lastBillingDate:
                z.coerce
                    .date()
                    .nullable()
                    .optional(),

            isTrial: z
                .boolean()
                .optional(),

            trialEndsAt:
                z.coerce
                    .date()
                    .nullable()
                    .optional(),

            status: z
                .enum(
                    SUBSCRIPTION_STATUS
                )
                .optional(),

            notes: z
                .string()
                .trim()
                .max(500)
                .optional(),
        })
        .refine(
            (data) =>
                Object.keys(data)
                    .length > 0,
            {
                message:
                    "At least one field must be provided for update.",
            }
        ),

    params: z.object({
        subscriptionId: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Delete Subscription
// ======================================================

export const deleteSubscriptionSchema =
    z.object({
        body: z
            .object({})
            .optional(),

        params: z.object({
            subscriptionId:
                objectId,
        }),

        query: z.object({}),
    });

// ======================================================
// Get Subscription
// ======================================================

export const getSubscriptionSchema =
    z.object({
        body: z
            .object({})
            .optional(),

        params: z.object({
            subscriptionId:
                objectId,
        }),

        query: z.object({}),
    });

// ======================================================
// Get Subscriptions
// ======================================================

export const getSubscriptionsSchema =
    z.object({
        body: z
            .object({})
            .optional(),

        params: z.object({}),

        query: paginationSchema
            .merge(
                searchSchema
            )
            .merge(
                dateRangeSchema
            )
            .merge(
                sortOrderSchema
            )
            .extend({
                account:
                    objectId.optional(),

                category:
                    objectId.optional(),

                provider: z
                    .string()
                    .trim()
                    .optional(),

                billingCycle:
                    z.enum(
                        BILLING_CYCLES
                    )
                    .optional(),

                paymentMethod:
                    z.enum(
                        PAYMENT_METHODS
                    )
                    .optional(),

                status: z
                    .enum(
                        SUBSCRIPTION_STATUS
                    )
                    .optional(),

                autoPay:
                    z.coerce
                        .boolean()
                        .optional(),

                sortBy: z
                    .enum([
                        "name",
                        "provider",
                        "nextBillingDate",
                        "createdAt",
                        "amount.amount",
                    ])
                    .default(
                        "nextBillingDate"
                    ),
            })
            .superRefine(dateRangeRefinement),
    });
// ======================================================
// Change Plan
// ======================================================

export const changePlanSchema = z.object({
    body: z.object({
        plan: z
            .string({ required_error: "Plan is required." })
            .trim()
            .min(1, "Plan is required."),
    }),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});

// ======================================================
// Renew Subscription
// ======================================================

export const renewSubscriptionSchema = z.object({
    body: z.object({
        endDate: z.coerce.date({
            required_error: "Subscription end date is required.",
            invalid_type_error: "Subscription end date must be a valid date.",
        }),
    }),

    params: z.object({
        id: objectId,
    }),

    query: z.object({}),
});
