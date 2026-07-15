import ApiError from "../../utils/ApiError.js";
import permissionService from "../../shared/services/permission.service.js";

import categoryRepository from "./category.repository.js";
import toCategoryDto, { toCategoryListDto } from "./category.mapper.js";
import { CATEGORY_PERMISSIONS } from "./category.permissions.js";

class CategoryService {
    async getCategoryOrFail(categoryId) {
        const category = await categoryRepository.findById(categoryId, { lean: false });
        if (!category) throw new ApiError(404, "Category not found.");
        return category;
    }

    requireAccess(workspaceId, userId, permissions) {
        return permissionService.requireWorkspaceRole(workspaceId, userId, permissions);
    }

    async createCategory(userId, payload) {
        await this.requireAccess(payload.workspace, userId, CATEGORY_PERMISSIONS.CREATE);
        const duplicate = await categoryRepository.findDuplicate(payload.workspace, payload.name, payload.type);
        if (duplicate) throw new ApiError(409, "Category with this name already exists.");

        return toCategoryDto(await categoryRepository.create(payload));
    }

    async getCategories(workspaceId, userId, query = {}) {
        await this.requireAccess(workspaceId, userId, CATEGORY_PERMISSIONS.VIEW);
        return toCategoryListDto(await categoryRepository.findForWorkspace(workspaceId, query));
    }

    async getCategoryById(categoryId, userId) {
        const category = await this.getCategoryOrFail(categoryId);
        await this.requireAccess(category.workspace, userId, CATEGORY_PERMISSIONS.VIEW);
        return toCategoryDto(category);
    }

    async updateCategory(categoryId, userId, payload) {
        const category = await this.getCategoryOrFail(categoryId);
        await this.requireAccess(category.workspace, userId, CATEGORY_PERMISSIONS.UPDATE);

        const name = payload.name ?? category.name;
        const type = payload.type ?? category.type;
        const duplicate = await categoryRepository.findDuplicate(category.workspace, name, type, categoryId);
        if (duplicate) throw new ApiError(409, "Category with this name already exists.");

        return toCategoryDto(await categoryRepository.updateById(categoryId, payload));
    }

    async archiveCategory(categoryId, userId) {
        const category = await this.getCategoryOrFail(categoryId);
        await this.requireAccess(category.workspace, userId, CATEGORY_PERMISSIONS.UPDATE);
        return toCategoryDto(await categoryRepository.updateById(categoryId, { isArchived: true }));
    }

    async restoreCategory(categoryId, userId) {
        const category = await this.getCategoryOrFail(categoryId);
        await this.requireAccess(category.workspace, userId, CATEGORY_PERMISSIONS.UPDATE);
        return toCategoryDto(await categoryRepository.updateById(categoryId, { isArchived: false }));
    }

    async permanentlyDeleteCategory(categoryId, userId) {
        const category = await this.getCategoryOrFail(categoryId);
        await this.requireAccess(category.workspace, userId, CATEGORY_PERMISSIONS.DELETE);
        await categoryRepository.deleteById(categoryId);
    }

    async getDefaultCategories(type) {
        return toCategoryListDto(await categoryRepository.findDefaults(type));
    }

    async cloneDefaultCategories(workspaceId, userId) {
        await this.requireAccess(workspaceId, userId, CATEGORY_PERMISSIONS.CLONE_DEFAULTS);
        return toCategoryListDto(await categoryRepository.cloneDefaults(workspaceId));
    }
}

export default new CategoryService();
