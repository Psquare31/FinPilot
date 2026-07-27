import Category from "../../models/Category.js";
import BaseRepository from "../../shared/repositories/base.repository.js";

class CategoryRepository extends BaseRepository {
    constructor() { super(Category); }

    findDuplicate(workspaceId, name, type, excludedId) {
        const filter = { workspace: workspaceId, name, type };
        if (excludedId) filter._id = { $ne: excludedId };
        return this.exists(filter);
    }

    findForWorkspace(workspaceId, { type, includeArchived = false } = {}) {
        const filter = { workspace: workspaceId };
        if (type) filter.type = type;
        if (!includeArchived) filter.isArchived = false;
        return this.find(filter, { sort: { name: 1 } });
    }

    findDefaults(type) {
        const filter = { isDefault: true };
        if (type) filter.type = type;
        return this.find(filter, { sort: { name: 1 } });
    }

    async cloneDefaults(workspaceId) {
        const defaults = await this.find({ isDefault: true });
        const categories = defaults.map(({ name, icon, color, type, parentCategory, description }) => ({
            workspace: workspaceId,
            name,
            icon,
            color,
            type,
            parentCategory,
            description,
            isDefault: false,
        }));

        return categories.length ? this.createMany(categories) : [];
    }
}

export default new CategoryRepository();
