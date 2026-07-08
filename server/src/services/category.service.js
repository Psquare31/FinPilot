import BaseService from "./base.service.js";
import ApiError from "../utils/ApiError.js";

import Category from "../models/Category.js";

class CategoryService extends BaseService {
  constructor() {
    super(Category);
  }

  // Create Category
  async createCategory(payload) {
    const existingCategory = await this.findOne({
      workspace: payload.workspace,
      name: payload.name,
      type: payload.type,
      isDeleted: false,
    });

    if (existingCategory) {
      throw new ApiError(
        409,
        "Category with this name already exists."
      );
    }

    return this.create(payload);
  }

  // Get Categories
  async getCategories(workspace, query = {}) {
    const { type, includeArchived = false } = query;

    const filter = {
      workspace,
    };

    if (type) {
      filter.type = type;
    }

    if (!includeArchived) {
      filter.isArchived = false;
    }

    return this.find(filter, {
      sort: {
        name: 1,
      },
    });
  }

  // Get Category by ID
  async getCategoryById(id) {
    return this.findById(id);
  }

  // Update Category
  async updateCategory(id, payload) {
    const category = await this.findById(id);

    const duplicate = await this.findOne({
      _id: {
        $ne: id,
      },
      workspace: category.workspace,
      name: payload.name,
      type: payload.type,
      isDeleted: false,
    });

    if (duplicate) {
      throw new ApiError(
        409,
        "Category with this name already exists."
      );
    }

    return this.updateById(id, payload);
  }

  // Archive Category
  async archiveCategory(id) {
    return this.updateById(id, {
      isArchived: true,
    });
  }

  // Restore Category
  async restoreCategory(id) {
    return this.updateById(id, {
      isArchived: false,
    });
  }

  // Delete Category
  async permanentlyDeleteCategory(id) {
    return this.deleteById(id);
  }

  // Get Default Categories
  async getDefaultCategories(type) {
    const filter = {
      isDefault: true,
    };

    if (type) {
      filter.type = type;
    }

    return this.find(filter, {
      sort: {
        name: 1,
      },
    });
  }

  // Duplicate Default Categories
  async cloneDefaultCategories(workspace) {
    const defaults = await Category.find({
      isDefault: true,
    }).lean();

    if (!defaults.length) {
      return [];
    }

    const categories = defaults.map((category) => ({
      workspace,
      name: category.name,
      icon: category.icon,
      color: category.color,
      type: category.type,
      parent: category.parent,
      description: category.description,
      isDefault: false,
    }));

    return Category.insertMany(categories);
  }
}

export default new CategoryService();