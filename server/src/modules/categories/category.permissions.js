import { ADMIN_ROLES, MEMBER_ROLES, OWNER_ROLES } from "../../shared/constants/roles.js";

export const CATEGORY_PERMISSIONS = Object.freeze({
    CREATE: ADMIN_ROLES,
    UPDATE: ADMIN_ROLES,
    DELETE: OWNER_ROLES,
    VIEW: MEMBER_ROLES,
    CLONE_DEFAULTS: ADMIN_ROLES,
});
