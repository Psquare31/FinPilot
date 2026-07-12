import { Router } from "express";

import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  archiveCategory,
  restoreCategory,
  deleteCategory,
  getDefaultCategories,
  cloneDefaultCategories,
} from "./category.controller.js";

import { requireAuth } from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.js";

import {
  createCategorySchema,
  updateCategorySchema,
  cloneDefaultCategoriesSchema,
} from "./category.validation.js";

const router = Router();

router.use(requireAuth);

// Categories
router.post(
  "/",
  validate(createCategorySchema),
  createCategory
);

router.get("/", getCategories);

router.get("/defaults", getDefaultCategories);

router.post(
  "/defaults/clone",
  validate(cloneDefaultCategoriesSchema),
  cloneDefaultCategories
);

router.get("/:id", getCategoryById);

router.patch(
  "/:id",
  validate(updateCategorySchema),
  updateCategory
);

router.patch("/:id/archive", archiveCategory);

router.patch("/:id/restore", restoreCategory);

router.delete("/:id", deleteCategory);

export default router;