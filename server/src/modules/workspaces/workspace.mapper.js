const toWorkspaceDto = (workspace) => {
    if (!workspace) return workspace;
    const source = typeof workspace.toObject === "function" ? workspace.toObject() : workspace;

    return {
        id: source._id?.toString?.() ?? source.id,
        name: source.name,
        slug: source.slug,
        description: source.description,
        type: source.type,
        owner: source.owner,
        currency: source.currency,
        timezone: source.timezone,
        locale: source.locale,
        color: source.color,
        icon: source.icon,
        status: source.status,
        isArchived: source.archived ?? source.isArchived,
        stats: source.stats,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
    };
};

export const toWorkspaceListDto = (workspaces = []) => workspaces.map(toWorkspaceDto);
export default toWorkspaceDto;
