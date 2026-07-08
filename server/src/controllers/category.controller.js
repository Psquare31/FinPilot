import categoryService from "../services/category.service.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create Category
export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  return res.status(201).json(
    new ApiResponse(
      201,
      category,
      "Category created successfully."
    )
  );
});

// Get Categories
export const getCategories = asyncHandler(async (req, res) => {
  const { workspace } = req.query;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const categories = await categoryService.getCategories(
    workspace,
    req.query
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      categories,
      "Categories fetched successfully."
    )
  );
});

// Get Category by ID
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      category,
      "Category fetched successfully."
    )
  );
});

// Update Category
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(
    req.params.id,
    req.body
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      category,
      "Category updated successfully."
    )
  );
});

// Archive Category
export const archiveCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.archiveCategory(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      category,
      "Category archived successfully."
    )
  );
});

// Restore Category
export const restoreCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.restoreCategory(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      category,
      "Category restored successfully."
    )
  );
});

// Delete Category
export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.permanentlyDeleteCategory(
    req.params.id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      null,
      "Category deleted successfully."
    )
  );
});

// Get Default Categories
export const getDefaultCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getDefaultCategories(
    req.query.type
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      categories,
      "Default categories fetched successfully."
    )
  );
});

// Clone Default Categories
export const cloneDefaultCategories = asyncHandler(async (req, res) => {
  const { workspace } = req.body;

  if (!workspace) {
    throw new ApiError(400, "Workspace ID is required.");
  }

  const categories =
    await categoryService.cloneDefaultCategories(workspace);

  return res.status(201).json(
    new ApiResponse(
      201,
      categories,
      "Default categories cloned successfully."
    )
  );
});