import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import Subscription from "../models/Subscription.js";

class SubscriptionService extends BaseService {
  constructor() {
    super(Subscription);
  }

  // Create Subscription
  async createSubscription(payload) {
    const existingSubscription = await this.findOne({
      workspace: payload.workspace,
      status: "active",
      isDeleted: false,
    });

    if (existingSubscription) {
      throw new ApiError(
        409,
        "An active subscription already exists."
      );
    }

    return this.create(payload);
  }

  // Get Subscription
  async getSubscription(workspace) {
    const subscription = await this.findOne({
      workspace,
      isDeleted: false,
    });

    if (!subscription) {
      throw new ApiError(
        404,
        "Subscription not found."
      );
    }

    return subscription;
  }

  // Update Subscription
  async updateSubscription(id, payload) {
    return this.updateById(id, payload);
  }

  // Change Plan
  async changePlan(id, plan) {
    return this.updateById(id, {
      plan,
    });
  }

  // Cancel Subscription
  async cancelSubscription(id) {
    return this.updateById(id, {
      status: "cancelled",
      cancelledAt: new Date(),
    });
  }

  // Resume Subscription
  async resumeSubscription(id) {
    return this.updateById(id, {
      status: "active",
      cancelledAt: null,
    });
  }

  // Renew Subscription
  async renewSubscription(id, endDate) {
    return this.updateById(id, {
      status: "active",
      endDate,
      renewedAt: new Date(),
    });
  }

  // Check Subscription Status
  async checkSubscriptionStatus(workspace) {
    const subscription =
      await this.getSubscription(workspace);

    const now = new Date();

    const expired =
      subscription.endDate &&
      subscription.endDate < now;

    return {
      active:
        subscription.status === "active" &&
        !expired,
      expired,
      status: subscription.status,
      plan: subscription.plan,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
    };
  }

  // Check Feature Access
  async checkFeatureAccess(workspace, feature) {
    const subscription =
      await this.getSubscription(workspace);

    if (subscription.status !== "active") {
      return false;
    }

    const features =
      subscription.features ?? [];

    return features.includes(feature);
  }

  // Get Subscription Summary
  async getSubscriptionSummary(workspace) {
    const subscription =
      await this.getSubscription(workspace);

    return {
      plan: subscription.plan,
      status: subscription.status,
      billingCycle:
        subscription.billingCycle,
      paymentMethod:
        subscription.paymentMethod,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      features:
        subscription.features ?? [],
    };
  }
}

export default new SubscriptionService();