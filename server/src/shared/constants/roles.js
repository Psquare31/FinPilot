export const WORKSPACE_ROLES = Object.freeze({
    OWNER: "owner",
    ADMIN: "admin",
    MEMBER: "member",
});

export const OWNER_ROLES = Object.freeze([
    WORKSPACE_ROLES.OWNER,
]);

export const ADMIN_ROLES = Object.freeze([
    WORKSPACE_ROLES.OWNER,
    WORKSPACE_ROLES.ADMIN,
]);

export const MEMBER_ROLES = Object.freeze([
    WORKSPACE_ROLES.OWNER,
    WORKSPACE_ROLES.ADMIN,
    WORKSPACE_ROLES.MEMBER,
]);