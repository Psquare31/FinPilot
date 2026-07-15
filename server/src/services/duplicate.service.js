import { exactMatchRegex } from "../utils/regex.js";

import ApiError from "../utils/ApiError.js";

class DuplicateService {
    // ======================================================
    // Ensure unique field.
    // ======================================================

    async ensureUniqueField({
        model,
        field,
        value,
        workspace = null,
        excludeId = null,
        message,
    }) {
        const filter = {};

        filter[field] = exactMatchRegex(value);

        if (workspace) {
            filter.workspace = workspace;
        }

        if (excludeId) {
            filter._id = {
                $ne: excludeId,
            };
        }

        const exists = await model.exists(filter);

        if (exists) {
            throw new ApiError(
                409,
                message ||
                    `${model.modelName} with this ${field} already exists.`
            );
        }

        return true;
    }

    // ======================================================
    // Ensure unique name.
    // ======================================================

    async ensureUniqueName({
        model,
        name,
        workspace = null,
        excludeId = null,
        message,
    }) {
        return this.ensureUniqueField({
            model,
            field: "name",
            value: name,
            workspace,
            excludeId,
            message,
        });
    }

    // ======================================================
    // Ensure unique slug.
    // ======================================================

    async ensureUniqueSlug({
        model,
        slug,
        excludeId = null,
        message,
    }) {
        return this.ensureUniqueField({
            model,
            field: "slug",
            value: slug,
            excludeId,
            message,
        });
    }

    // ======================================================
    // Ensure unique email.
    // ======================================================

    async ensureUniqueEmail({
        model,
        email,
        excludeId = null,
        message,
    }) {
        return this.ensureUniqueField({
            model,
            field: "email",
            value: email,
            excludeId,
            message,
        });
    }

    // ======================================================
    // Ensure unique code.
    // ======================================================

    async ensureUniqueCode({
        model,
        code,
        workspace = null,
        excludeId = null,
        message,
    }) {
        return this.ensureUniqueField({
            model,
            field: "code",
            value: code,
            workspace,
            excludeId,
            message,
        });
    }

    // ======================================================
    // Check duplicate.
    // ======================================================

    async exists({
        model,
        filter,
    }) {
        return Boolean(
            await model.exists(filter)
        );
    }
}

export default new DuplicateService();