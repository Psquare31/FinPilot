import subscriptionService from "../services/subscription.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create Subscription
export const createSubscription = asyncHandler(async (req, res) => {
  const subscription =
    await subscriptionService.createSubscription(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      subscription,
      "Subscription created successfully."
    )
  );
});

// Get Subscription
export const getSubscription = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const subscription =
    await subscriptionService.getSubscription(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      subscription,
      "Subscription fetched successfully."
    )
  );
});

// Update Subscription
export const updateSubscription = asyncHandler(async (req, res) => {
  const subscription =
    await subscriptionService.updateSubscription(
      req.params.id,
      req.body
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      subscription,
      "Subscription updated successfully."
    )
  );
});

// Change Plan
export const changePlan = asyncHandler(async (req, res) => {
  const { plan } = req.body;

  if (!plan) {
    throw new ApiError(400, "Plan is required.");
  }

  const subscription =
    await subscriptionService.changePlan(
      req.params.id,
      plan
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      subscription,
      "Subscription plan changed successfully."
    )
  );
});

// Cancel Subscription
export const cancelSubscription = asyncHandler(async (req, res) => {
  const subscription =
    await subscriptionService.cancelSubscription(
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      subscription,
      "Subscription cancelled successfully."
    )
  );
});

// Resume Subscription
export const resumeSubscription = asyncHandler(async (req, res) => {
  const subscription =
    await subscriptionService.resumeSubscription(
      req.params.id
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      subscription,
      "Subscription resumed successfully."
    )
  );
});

// Renew Subscription
export const renewSubscription = asyncHandler(async (req, res) => {
  const { endDate } = req.body;

  if (!endDate) {
    throw new ApiError(
      400,
      "Subscription end date is required."
    );
  }

  const subscription =
    await subscriptionService.renewSubscription(
      req.params.id,
      endDate
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      subscription,
      "Subscription renewed successfully."
    )
  );
});

// Check Subscription Status
export const checkSubscriptionStatus = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const status =
    await subscriptionService.checkSubscriptionStatus(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      status,
      "Subscription status fetched successfully."
    )
  );
});

// Check Feature Access
export const checkFeatureAccess = asyncHandler(async (req, res) => {
  const { workspace, feature } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  if (!feature) {
    throw new ApiError(400, "Feature is required.");
  }

  const hasAccess =
    await subscriptionService.checkFeatureAccess(
      workspace,
      feature
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        feature,
        hasAccess,
      },
      "Feature access checked successfully."
    )
  );
});

// Get Subscription Summary
export const getSubscriptionSummary = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const summary =
    await subscriptionService.getSubscriptionSummary(
      workspace
    );

  return res.status(200).json(
    new ApiResponse(
      200,
      summary,
      "Subscription summary fetched successfully."
    )
  );
});