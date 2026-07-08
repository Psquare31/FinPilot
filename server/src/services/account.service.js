import BaseService from "./base.service.js";

import Account from "../models/Account.js";
import Workspace from "../models/Workspace.js";

import ApiError from "../utils/ApiError.js";
import ApiFeatures from "../utils/ApiFeatures.js";

class AccountService extends BaseService {
  constructor() {
    super(Account);
  }

  // Create Account
  async createAccount(data) {
    const workspace = await Workspace.findById(data.workspace);

    if (!workspace) {
      throw new ApiError(404, "Workspace not found.");
    }

    const duplicate = await this.model.exists({
      workspace: data.workspace,
      name: {
        $regex: `^${data.name.trim()}$`,
        $options: "i",
      },
      isDeleted: false,
    });

    if (duplicate) {
      throw new ApiError(
        409,
        "An account with this name already exists in the workspace."
      );
    }

    const account = await this.create({
      ...data,
      name: data.name.trim(),
    });

    return account;
  }

  // Get Account by ID
  async getAccountById(accountId) {
    const account = await this.model
      .findById(accountId)
      .populate("workspace", "name slug currency")
      .lean();

    if (!account) {
      throw new ApiError(404, "Account not found.");
    }

    return account;
  }

  // Get Accounts
  async getAccounts(workspaceId, query) {
    const workspace = await Workspace.exists({
      _id: workspaceId,
    });

    if (!workspace) {
      throw new ApiError(404, "Workspace not found.");
    }

    const features = new ApiFeatures(
      this.model.find({
        workspace: workspaceId,
        isDeleted: false,
      }),
      query
    )
      .filter()
      .search(["name", "institution"])
      .sort()
      .limitFields()
      .paginate()
      .populate()
      .lean();

    return await features.execute();
  }

  // Update Account
  async updateAccount(accountId, payload) {
    const account = await this.model.findById(accountId);

    if (!account) {
      throw new ApiError(404, "Account not found.");
    }

    if (
      payload.name &&
      payload.name.trim().toLowerCase() !==
        account.name.toLowerCase()
    ) {
      const duplicate = await this.model.exists({
        workspace: account.workspace,
        name: {
          $regex: `^${payload.name.trim()}$`,
          $options: "i",
        },
        _id: {
          $ne: accountId,
        },
        isDeleted: false,
      });

      if (duplicate) {
        throw new ApiError(
          409,
          "An account with this name already exists."
        );
      }
    }

    return await this.updateById(accountId, {
      ...payload,
      ...(payload.name && {
        name: payload.name.trim(),
      }),
    });
  }

  // Archive Account
  async archiveAccount(accountId) {
    return await this.softDelete(accountId);
  }

  // Restore Account
  async restoreAccount(accountId) {
    return await this.restore(accountId);
  }

  // Delete Account
  async permanentlyDeleteAccount(accountId) {
    return await this.deleteById(accountId);
  }

  // Get Total Balance
  async getTotalBalance(workspaceId) {
    const result = await this.aggregate([
      {
        $match: {
          workspace: workspaceId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalBalance: {
            $sum: "$currentBalance",
          },
          accountCount: {
            $sum: 1,
          },
        },
      },
    ]);

    return (
      result[0] || {
        totalBalance: 0,
        accountCount: 0,
      }
    );
  }

  // Adjust Account Balance
  async adjustBalance(accountId, amount) {
    const account = await this.model.findById(accountId);

    if (!account) {
      throw new ApiError(404, "Account not found.");
    }

    account.currentBalance += amount;

    await account.save();

    return account;
  }

  // Check if Account Exists
  async accountExists(accountId) {
    return await this.model.exists({
      _id: accountId,
      isDeleted: false,
    });
  }
}

export default new AccountService();