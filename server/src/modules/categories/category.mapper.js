const toCategoryDto = (category) => {
    if (!category) return category;
    const source = typeof category.toObject === "function" ? category.toObject() : category;

    return {
        id: source._id?.toString?.() ?? source.id,
        workspace: source.workspace,
        name: source.name,
        type: source.type,
        icon: source.icon,
        color: source.color,
        description: source.description,
        parent: source.parentCategory,
        isDefault: source.isDefault,
        isArchived: source.isArchived,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
    };
};

export const toCategoryListDto = (categories = []) => categories.map(toCategoryDto);
export default toCategoryDto;
