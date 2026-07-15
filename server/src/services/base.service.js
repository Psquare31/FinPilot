import ApiError from "../utils/ApiError.js";

class BaseService {
    constructor(model) {
        if (!model) {
            throw new Error(
                "Model is required for BaseService."
            );
        }

        this.model = model;
    }

    // ======================================================
    // Create document.
    // ======================================================

    async create(payload, options = {}) {
        const [document] =
            await this.model.create(
                [payload],
                options
            );

        return document;
    }

    // ======================================================
    // Create multiple documents.
    // ======================================================

    async createMany(
        payload = [],
        options = {}
    ) {
        return this.model.insertMany(
            payload,
            options
        );
    }

    // ======================================================
    // Find document by id.
    // ======================================================

    async findById(id, options = {}) {
        const query = this.model.findById(id);

        if (options.select) {
            query.select(options.select);
        }

        if (options.populate) {
            const populate = Array.isArray(
                options.populate
            )
                ? options.populate
                : [options.populate];

            populate.forEach((item) =>
                query.populate(item)
            );
        }

        if (options.lean !== false) {
            query.lean();
        }

        const document = await query;

        if (!document) {
            throw new ApiError(
                404,
                `${this.model.modelName} not found.`
            );
        }

        return document;
    }

    // ======================================================
    // Find one document.
    // ======================================================

    async findOne(
        filter = {},
        options = {}
    ) {
        const query =
            this.model.findOne(filter);

        if (options.select) {
            query.select(options.select);
        }

        if (options.populate) {
            const populate = Array.isArray(
                options.populate
            )
                ? options.populate
                : [options.populate];

            populate.forEach((item) =>
                query.populate(item)
            );
        }

        if (options.sort) {
            query.sort(options.sort);
        }

        if (options.lean !== false) {
            query.lean();
        }

        return query;
    }

    // ======================================================
    // Find one or fail.
    // ======================================================

    async findOneOrFail(
        filter = {},
        options = {}
    ) {
        const document =
            await this.findOne(
                filter,
                options
            );

        if (!document) {
            throw new ApiError(
                404,
                `${this.model.modelName} not found.`
            );
        }

        return document;
    }

    // ======================================================
    // Find documents.
    // ======================================================

    async find(
        filter = {},
        options = {}
    ) {
        const query =
            this.model.find(filter);

        if (options.select) {
            query.select(options.select);
        }

        if (options.populate) {
            const populate = Array.isArray(
                options.populate
            )
                ? options.populate
                : [options.populate];

            populate.forEach((item) =>
                query.populate(item)
            );
        }

        if (options.sort) {
            query.sort(options.sort);
        }

        if (options.skip) {
            query.skip(options.skip);
        }

        if (options.limit) {
            query.limit(options.limit);
        }

        if (options.lean !== false) {
            query.lean();
        }

        return query;
    }

    // ======================================================
    // Check existence.
    // ======================================================

    async exists(filter = {}) {
        return Boolean(
            await this.model.exists(filter)
        );
    }

    // ======================================================
    // Check existence or fail.
    // ======================================================

    async existsOrFail(
        filter = {},
        message
    ) {
        const exists =
            await this.exists(filter);

        if (!exists) {
            throw new ApiError(
                404,
                message ||
                    `${this.model.modelName} not found.`
            );
        }

        return true;
    }

    // ======================================================
    // Update by id.
    // ======================================================

    async updateById(
        id,
        payload,
        options = {}
    ) {
        const document =
            await this.model.findByIdAndUpdate(
                id,
                payload,
                {
                    new: true,
                    runValidators: true,
                    ...options,
                }
            );

        if (!document) {
            throw new ApiError(
                404,
                `${this.model.modelName} not found.`
            );
        }

        return document;
    }

    // ======================================================
    // Delete by id.
    // ======================================================

    async deleteById(id) {
        const document =
            await this.model.findByIdAndDelete(
                id
            );

        if (!document) {
            throw new ApiError(
                404,
                `${this.model.modelName} not found.`
            );
        }

        return document;
    }

    // ======================================================
    // Archive by id.
    // ======================================================

    async archiveById(id) {
        return this.updateById(id, {
            isArchived: true,
        });
    }

    // ======================================================
    // Restore by id.
    // ======================================================

    async restoreById(id) {
        return this.updateById(id, {
            isArchived: false,
        });
    }

    // ======================================================
    // Count documents.
    // ======================================================

    async count(filter = {}) {
        return this.model.countDocuments(
            filter
        );
    }

    // ======================================================
    // Aggregate documents.
    // ======================================================

    async aggregate(
        pipeline = []
    ) {
        return this.model.aggregate(
            pipeline
        );
    }
}

export default BaseService;