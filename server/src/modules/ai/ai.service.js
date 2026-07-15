import BaseService from "../../shared/services/base.service.js";
import ApiError from "../../utils/ApiError.js";

import AIInteraction from "../../models/AIInteraction.js";

class AIInteractionService extends BaseService {
  constructor() {
    super(AIInteraction);
  }

  // Create AI Interaction
  async createInteraction(payload) {
    return this.create(payload);
  }

  // Get AI Interactions
  async getInteractions(workspace, query = {}) {
    const {
      page = 1,
      limit = 20,
      model,
      feature,
    } = query;

    const filter = {
      workspace,
      isDeleted: false,
    };

    if (model) {
      filter.model = model;
    }

    if (feature) {
      filter.feature = feature;
    }

    return this.paginate(filter, {
      page: Number(page),
      limit: Number(limit),
      sort: "-createdAt",
    });
  }

  // Get AI Interaction by ID
  async getInteractionById(id) {
    return this.findById(id);
  }

  // Delete AI Interaction
  async deleteInteraction(id) {
    return this.deleteById(id);
  }

  // Get Conversation History
  async getConversationHistory(conversationId) {
    return this.find(
      {
        conversationId,
        isDeleted: false,
      },
      {
        sort: {
          createdAt: 1,
        },
      }
    );
  }

  // Get AI Usage Summary
  async getUsageSummary(workspace) {
    const summary = await this.aggregate([
      {
        $match: {
          workspace,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalPrompts: {
            $sum: 1,
          },
          totalTokens: {
            $sum: "$tokenUsage.total",
          },
          totalCost: {
            $sum: "$cost",
          },
        },
      },
    ]);

    return (
      summary[0] || {
        totalPrompts: 0,
        totalTokens: 0,
        totalCost: 0,
      }
    );
  }

  // Get Feature Usage
  async getFeatureUsage(workspace) {
    return this.aggregate([
      {
        $match: {
          workspace,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$feature",
          requests: {
            $sum: 1,
          },
          tokens: {
            $sum: "$tokenUsage.total",
          },
        },
      },
      {
        $sort: {
          requests: -1,
        },
      },
    ]);
  }

  // Record User Feedback
  async recordFeedback(id, feedback) {
    return this.updateById(id, {
      feedback,
    });
  }

  // Get Available Models
  async getAvailableModels() {
    return [
      {
        id: "gpt-5.5",
        name: "GPT-5.5",
      },
      {
        id: "gpt-5-mini",
        name: "GPT-5 Mini",
      },
      {
        id: "gpt-4.1",
        name: "GPT-4.1",
      },
    ];
  }
}

export default new AIInteractionService();