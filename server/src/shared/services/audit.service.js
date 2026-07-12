import BaseService from "./base.service.js";

import AuditLog from "../models/AuditLog.js";

class AuditLogService extends BaseService {
  constructor() {
    super(AuditLog);
  }

  // Create Audit Log
  async createLog(payload) {
    return this.create(payload);
  }

  // Get Audit Logs
  async getLogs(workspace, query = {}) {
    const {
      page = 1,
      limit = 20,
      user,
      action,
      resource,
      startDate,
      endDate,
    } = query;

    const filter = {
      workspace,
      isDeleted: false,
    };

    if (user) {
      filter.user = user;
    }

    if (action) {
      filter.action = action;
    }

    if (resource) {
      filter.resource = resource;
    }

    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-createdAt",
    });
  }

  // Get Audit Log by ID
  async getLogById(id) {
    return this.findById(id);
  }

  // Delete Audit Log
  async deleteLog(id) {
    return this.deleteById(id);
  }

  // Delete Old Logs
  async deleteOldLogs(beforeDate) {
    const result = await this.deleteMany({
      createdAt: {
        $lt: beforeDate,
      },
    });

    return {
      deletedCount: result.deletedCount,
    };
  }

  // Get Activity Summary
  async getActivitySummary(workspace) {
    const summary = await this.aggregate([
      {
        $match: {
          workspace,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$action",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);

    return summary;
  }

  // Get User Activity
  async getUserActivity(userId, limit = 20) {
    return this.model
      .find({
        user: userId,
        isDeleted: false,
      })
      .sort({
        createdAt: -1,
      })
      .limit(limit)
      .lean();
  }

  // Get Resource Activity
  async getResourceActivity(resource, resourceId) {
    return this.model
      .find({
        resource,
        resourceId,
        isDeleted: false,
      })
      .sort({
        createdAt: -1,
      })
      .lean();
  }
}

export default new AuditLogService();