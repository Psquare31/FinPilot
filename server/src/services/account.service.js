import BaseService from "./base.service.js";

import Account from "../models/Account.js";
import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";

import ApiError from "../utils/ApiError.js";
import ApiFeatures from "../utils/ApiFeatures.js";

class AccountService extends BaseService {
    constructor() {
        super(Account);
    }

    // Check workspace access
    async checkWorkspaceAccess(
        workspaceId,
        userId,
        roles = []
    ) {
        const workspace = await Workspace.findById(workspaceId);

        if (!workspace) {
            throw new ApiError(
                404,
                "Workspace not found."
            );
        }

        const membership =
            await WorkspaceMember.findOne({
                workspace: workspaceId,
                user: userId,
                status: "active",
            });

        if (!membership) {
            throw new ApiError(
                403,
                "You do not have access to this workspace."
            );
        }

        if (
            roles.length &&
            !roles.includes(membership.role)
        ) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action."
            );
        }

        return membership;
    }

    // Create account
    async createAccount(userId, payload) {
        await this.checkWorkspaceAccess(
            payload.workspace,
            userId,
            ["owner", "admin"]
        );

        const duplicate = await this.model.exists({
            workspace: payload.workspace,
            name: {
                $regex: `^${payload.name.trim()}$`,
                $options: "i",
            },
        });

        if (duplicate) {
            throw new ApiError(
                409,
                "An account with this name already exists in this workspace."
            );
        }

        return this.create({
            ...payload,
            name: payload.name.trim(),
            openingBalance:
                payload.openingBalance ?? 0,
            balance:
                payload.openingBalance ?? 0,
        });
    }

    // Get account by id
    async getAccountById(
        accountId,
        userId
    ) {
        const account =
            await this.model.findById(accountId);

        if (!account) {
            throw new ApiError(
                404,
                "Account not found."
            );
        }

        await this.checkWorkspaceAccess(
            account.workspace,
            userId
        );

        return await account.populate(
            "workspace",
            "name slug currency"
        );
    }

    // Get workspace accounts
    async getAccounts(workspaceId, userId, query) {
        await this.checkWorkspaceAccess(workspaceId, userId);

        const features = new ApiFeatures(
            this.model.find({
                workspace: workspaceId,
                isArchived: false,
            }),
            query
        )
            .filter()
            .search(["name", "institution"])
            .sort()
            .limitFields()
            .paginate()
            .populate();

        return features.execute();
    }

    // Update account
    async updateAccount(accountId, userId, payload) {
        const account = await this.model.findById(accountId);

        if (!account) {
            throw new ApiError(404, "Account not found.");
        }

        await this.checkWorkspaceAccess(account.workspace, userId, ["owner", "admin"]);
        
        const escapeRegex = (value) =>
            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        if (payload.name && payload.name.trim().toLowerCase() !== account.name.toLowerCase()) {
            const duplicate = await this.model.exists({
                workspace: account.workspace,
                name: {
                    $regex: `^${escapeRegex(payload.name.trim())}$`,
                    $options: "i",
                },
                _id: {
                    $ne: accountId,
                },
            });

            if (duplicate) {
                throw new ApiError(409, "An account with this name already exists.");
            }
        }

        Object.assign(account, {
            ...payload,
            ...(payload.name && {
                name: payload.name.trim(),
            }),
        });

        await account.save();

        return account;
    }

    // Archive account
    async archiveAccount(
        accountId,
        userId
    ) {
        const account = await this.model.findById(accountId);

        if (!account) {
            throw new ApiError(
                404,
                "Account not found."
            );
        }

        await this.checkWorkspaceAccess(
            account.workspace,
            userId,
            ["owner", "admin"]
        );

        if (account.isArchived) {
            throw new ApiError(
                400,
                "Account is already archived."
            );
        }

        return account.archive();
    }

    // Restore account
    async restoreAccount(
        accountId,
        userId
    ) {
        const account = await this.model.findById(accountId);

        if (!account) {
            throw new ApiError(
                404,
                "Account not found."
            );
        }

        await this.checkWorkspaceAccess(
            account.workspace,
            userId,
            ["owner", "admin"]
        );

        if (!account.isArchived) {
            throw new ApiError(
                400,
                "Account is already active."
            );
        }

        return account.restore();
    }

    // Delete account
    async permanentlyDeleteAccount(
        accountId,
        userId
    ) {
        const account = await this.model.findById(accountId);

        if (!account) {
            throw new ApiError(
                404,
                "Account not found."
            );
        }

        await this.checkWorkspaceAccess(
            account.workspace,
            userId,
            ["owner"]
        );

        return this.deleteById(accountId);
    }

    // Get total balance
    async getTotalBalance(workspaceId, userId) {
        await this.checkWorkspaceAccess(workspaceId, userId);

        const result = await this.aggregate([
            {
                $match: {
                    workspace: workspaceId,
                    isArchived: false,
                },
            },
            {
                $group: {
                    _id: null,
                    totalBalance: {
                        $sum: "$balance",
                    },
                    accountCount: {
                        $sum: 1,
                    },
                },
            },
        ]);

        return result[0] || {
            totalBalance: 0,
            accountCount: 0,
        };
    }

    // Adjust balance
    async adjustBalance(accountId, amount, userId) {
        const account = await this.model.findById(accountId);

        if (!account) {
            throw new ApiError(404, "Account not found.");
        }

        await this.checkWorkspaceAccess(account.workspace, userId, ["owner", "admin"]);

        account.balance = Number((account.balance + amount).toFixed(2));

        await account.save();

        return account;
    }

    // Reconcile account
    async reconcileAccount(accountId, newBalance, userId) {
        const account = await this.model.findById(accountId);

        if (!account) {
            throw new ApiError(404, "Account not found.");
        }

        await this.checkWorkspaceAccess(account.workspace, userId, ["owner", "admin"]);

        await account.reconcile(newBalance);

        return account;
    }

    // Check account exists
    async accountExists(accountId) {
        return this.model.exists({
            _id: accountId,
            isArchived: false,
        });
    }
}

export default new AccountService();