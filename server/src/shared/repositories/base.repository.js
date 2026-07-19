import ApiError from "../../utils/ApiError.js";

class BaseRepository {
    constructor(model) {
        if (!model) throw new Error("Model is required for BaseRepository.");
        this.model = model;
    }

    findById(id, options = {}) {
        const query = this.model.findById(id);
        if (options.lean !== false) query.lean();
        if (options.populate) query.populate(options.populate);
        if (options.select) query.select(options.select);
        return query;
    }

    findOne(filter = {}, options = {}) {
        const query = this.model.findOne(filter);
        if (options.lean !== false) query.lean();
        if (options.populate) query.populate(options.populate);
        if (options.select) query.select(options.select);
        return query;
    }

    find(filter = {}, options = {}) {
        const query = this.model.find(filter);
        if (options.lean !== false) query.lean();
        if (options.sort) query.sort(options.sort);
        if (options.populate) query.populate(options.populate);
        if (options.select) query.select(options.select);
        if (options.skip) query.skip(options.skip);
        if (options.limit) query.limit(options.limit);
        return query;
    }

    async findByIdOrFail(id, options = {}) {
        const document = await this.findById(id, options);
        if (!document) throw new ApiError(404, `${this.model.modelName} not found.`);
        return document;
    }

    // `Model.create(doc, options)` is a trap: when the first argument is not
    // an array, Mongoose treats every remaining argument as another document
    // to insert — so an `options = {}` default becomes a second, empty doc and
    // fails validation ("Path `name`/`owner` is required"). Use the array form
    // so the second argument is unambiguously the options object.
    async create(payload, options = {}) {
        if (Array.isArray(payload)) {
            return this.model.create(payload, options);
        }

        const [document] = await this.model.create([payload], options);

        return document;
    }
    createMany(payload = [], options = {}) { return this.model.insertMany(payload, options); }

    update(filter, payload, options = {}) {
        return this.model.findOneAndUpdate(filter, payload, {
            new: true,
            runValidators: true,
            ...options,
        });
    }

    updateById(id, payload, options = {}) { return this.model.findByIdAndUpdate(id, payload, { new: true, runValidators: true, ...options }); }
    delete(filter) { return this.model.findOneAndDelete(filter); }
    deleteById(id) { return this.model.findByIdAndDelete(id); }
    aggregate(pipeline = [], options = {}) { return this.model.aggregate(pipeline, options); }
    exists(filter = {}) { return this.model.exists(filter); }
    count(filter = {}) { return this.model.countDocuments(filter); }

    async paginate(filter = {}, options = {}) {
        const page = Math.max(Number(options.page) || 1, 1);
        const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
        const [data, total] = await Promise.all([
            this.find(filter, { ...options, skip: (page - 1) * limit, limit }),
            this.count(filter),
        ]);

        return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }
}

export default BaseRepository;
