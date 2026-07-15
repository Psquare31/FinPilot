import ApiError from "../../utils/ApiError.js";
import permissionService from "../../shared/services/permission.service.js";

import accountRepository from "./account.repository.js";
import toAccountDto, { toAccountListDto } from "./account.mapper.js";
import { ACCOUNT_PERMISSIONS } from "./account.permissions.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class AccountService {
    async requireAccess(workspaceId, userId, permissions) {
        return permissions
            ? permissionService.requireWorkspaceRole(workspaceId, userId, permissions)
            : permissionService.requireWorkspaceAccess(workspaceId, userId);
    }

    async getAccountOrFail(accountId) {
        const account = await accountRepository.findById(accountId, { lean: false });

        if (!account) throw new ApiError(404, "Account not found.");

        return account;
    }

    async createAccount(userId, payload) {
        await this.requireAccess(payload.workspace, userId, ACCOUNT_PERMISSIONS.CREATE);

        const name = payload.name.trim();
        const duplicate = await accountRepository.findDuplicateName(
            payload.workspace,
            escapeRegex(name)
        );

        if (duplicate) {
            throw new ApiError(409, "An account with this name already exists in this workspace.");
        }

        const account = await accountRepository.create({
            ...payload,
            name,
            openingBalance: payload.openingBalance ?? 0,
            balance: payload.openingBalance ?? 0,
        });

        return toAccountDto(account);
    }

    async getAccountById(accountId, userId) {
        const account = await this.getAccountOrFail(accountId);
        await this.requireAccess(account.workspace, userId, ACCOUNT_PERMISSIONS.VIEW);

        const populated = await account.populate("workspace", "name slug currency");
        return toAccountDto(populated);
    }

    async getAccounts(workspaceId, userId, query = {}) {
        await this.requireAccess(workspaceId, userId, ACCOUNT_PERMISSIONS.VIEW);
        const result = await accountRepository.findActiveByWorkspace(workspaceId, query);

        return { ...result, data: toAccountListDto(result.data) };
    }

    async updateAccount(accountId, userId, payload) {
        const account = await this.getAccountOrFail(accountId);
        await this.requireAccess(account.workspace, userId, ACCOUNT_PERMISSIONS.UPDATE);

        const update = { ...payload };

        if (payload.name) {
            const name = payload.name.trim();
            if (name.toLowerCase() !== account.name.toLowerCase()) {
                const duplicate = await accountRepository.findDuplicateName(
                    account.workspace,
                    escapeRegex(name),
                    accountId
                );

                if (duplicate) throw new ApiError(409, "An account with this name already exists.");
            }
            update.name = name;
        }

        return toAccountDto(await accountRepository.updateById(accountId, update));
    }

    async archiveAccount(accountId, userId) {
        const account = await this.getAccountOrFail(accountId);
        await this.requireAccess(account.workspace, userId, ACCOUNT_PERMISSIONS.UPDATE);
        if (account.isArchived) throw new ApiError(400, "Account is already archived.");

        return toAccountDto(await accountRepository.updateById(accountId, {
            isArchived: true,
            status: "inactive",
        }));
    }

    async restoreAccount(accountId, userId) {
        const account = await this.getAccountOrFail(accountId);
        await this.requireAccess(account.workspace, userId, ACCOUNT_PERMISSIONS.UPDATE);
        if (!account.isArchived) throw new ApiError(400, "Account is already active.");

        return toAccountDto(await accountRepository.updateById(accountId, {
            isArchived: false,
            status: "active",
        }));
    }

    async permanentlyDeleteAccount(accountId, userId) {
        const account = await this.getAccountOrFail(accountId);
        await this.requireAccess(account.workspace, userId, ACCOUNT_PERMISSIONS.DELETE);
        await accountRepository.deleteById(accountId);
    }

    async getTotalBalance(workspaceId, userId) {
        await this.requireAccess(workspaceId, userId, ACCOUNT_PERMISSIONS.VIEW);
        const result = await accountRepository.aggregate([
            { $match: { workspace: workspaceId, isArchived: false } },
            { $group: { _id: null, totalBalance: { $sum: "$balance" }, accountCount: { $sum: 1 } } },
        ]);

        return result[0] || { totalBalance: 0, accountCount: 0 };
    }

    async adjustBalance(accountId, amount, userId) {
        const account = await this.getAccountOrFail(accountId);
        await this.requireAccess(account.workspace, userId, ACCOUNT_PERMISSIONS.UPDATE);

        return toAccountDto(await accountRepository.updateById(accountId, {
            balance: Number((account.balance + amount).toFixed(2)),
        }));
    }

    async reconcileAccount(accountId, balance, userId) {
        const account = await this.getAccountOrFail(accountId);
        await this.requireAccess(account.workspace, userId, ACCOUNT_PERMISSIONS.UPDATE);

        return toAccountDto(await accountRepository.updateById(accountId, {
            balance,
            lastReconciledAt: new Date(),
        }));
    }

    async accountExists(accountId) {
        return Boolean(await accountRepository.exists({ _id: accountId, isArchived: false }));
    }
}

export default new AccountService();
