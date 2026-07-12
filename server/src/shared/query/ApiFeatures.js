import { containsRegex } from "../utils/regex.js";

class ApiFeatures {
    constructor(query, queryString = {}) {
        this.query = query;
        this.queryString = queryString;

        this.page = 1;
        this.limit = 10;
        this.paginationEnabled = false;
    }

    // ======================================================
    // Apply filters.
    // ======================================================

    filter() {
        const queryObj = { ...this.queryString };

        [
            "page",
            "limit",
            "sort",
            "fields",
            "search",
            "populate",
            "from",
            "to",
            "status",
            "archived",
        ].forEach((field) => delete queryObj[field]);

        let queryStr = JSON.stringify(queryObj);

        queryStr = queryStr.replace(
            /\b(gte|gt|lte|lt|in|nin|ne|regex)\b/g,
            (match) => `$${match}`
        );

        this.query = this.query.find(
            JSON.parse(queryStr)
        );

        return this;
    }

    // ======================================================
    // Apply search.
    // ======================================================

    search(fields = []) {
        if (
            !this.queryString.search ||
            !fields.length
        ) {
            return this;
        }

        const keyword =
            this.queryString.search.trim();

        this.query = this.query.find({
            $or: fields.map((field) => ({
                [field]: containsRegex(keyword),
            })),
        });

        return this;
    }

    // ======================================================
    // Apply sorting.
    // ======================================================

    sort(defaultSort = "-createdAt") {
        const sort =
            this.queryString.sort
                ?.split(",")
                .join(" ") || defaultSort;

        this.query = this.query.sort(sort);

        return this;
    }

    // ======================================================
    // Limit selected fields.
    // ======================================================

    limitFields() {
        const fields =
            this.queryString.fields
                ?.split(",")
                .join(" ");

        this.query.select(fields || "-__v");

        return this;
    }

    // ======================================================
    // Apply pagination.
    // ======================================================

    paginate(maxLimit = 100) {
        this.paginationEnabled = true;

        this.page = Math.max(
            Number(this.queryString.page) || 1,
            1
        );

        this.limit = Math.min(
            Math.max(
                Number(this.queryString.limit) || 10,
                1
            ),
            maxLimit
        );

        const skip =
            (this.page - 1) * this.limit;

        this.query = this.query
            .skip(skip)
            .limit(this.limit);

        return this;
    }

    // ======================================================
    // Populate relations.
    // ======================================================

    populate() {
        if (!this.queryString.populate) {
            return this;
        }

        const paths =
            this.queryString.populate.split(",");

        paths.forEach((item) => {
            const [path, select] =
                item.split(":");

            this.query.populate({
                path: path.trim(),
                select: select
                    ? select.replaceAll("|", " ")
                    : undefined,
            });
        });

        return this;
    }

    // ======================================================
    // Filter archived documents.
    // ======================================================

    archived(field = "isArchived") {
        const archived =
            this.queryString.archived === "true";

        this.query = this.query.find({
            [field]: archived,
        });

        return this;
    }

    // ======================================================
    // Filter by status.
    // ======================================================

    status(field = "status") {
        if (!this.queryString.status) {
            return this;
        }

        this.query = this.query.find({
            [field]:
                this.queryString.status,
        });

        return this;
    }

    // ======================================================
    // Filter by date.
    // ======================================================

    date(field = "createdAt") {
        const { from, to } =
            this.queryString;

        if (!from && !to) {
            return this;
        }

        const filter = {};

        if (from) {
            filter.$gte = new Date(from);
        }

        if (to) {
            filter.$lte = new Date(to);
        }

        this.query = this.query.find({
            [field]: filter,
        });

        return this;
    }

    // ======================================================
    // Return lean documents.
    // ======================================================

    lean() {
        this.query = this.query.lean();

        return this;
    }

    // ======================================================
    // Execute query.
    // ======================================================

    async execute() {
        const data = await this.query.exec();

        if (!this.paginationEnabled) {
            return data;
        }

        return {
            data,
            pagination: {
                page: this.page,
                limit: this.limit,
                count: data.length,
            },
        };
    }
}

export default ApiFeatures;