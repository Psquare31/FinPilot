import ApiError from "../utils/ApiError.js";

class BaseService {
  constructor(model) {
    if (!model) {
      throw new Error("Model is required for BaseService.");
    }

    this.model = model;
  }

  async create(payload, options = {}) {
    const [document] = await this.model.create([payload], options);
    return document;
  }

  async createMany(payload = [], options = {}) {
    return this.model.insertMany(payload, options);
  }

  async findById(id, options = {}) {
    const document = await this.model
      .findById(id)
      .setOptions(options)
      .lean();

    if (!document) {
      throw new ApiError(404, `${this.model.modelName} not found.`);
    }

    return document;
  }

  async findOne(filter = {}, options = {}) {
    return this.model.findOne(filter).setOptions(options).lean();
  }

  async find(filter = {}, options = {}) {
    return this.model.find(filter).setOptions(options).lean();
  }

  async paginate(
    filter = {},
    {
      page = 1,
      limit = 10,
      sort = "-createdAt",
      select = "",
      populate = [],
    } = {}
  ) {
    const skip = (page - 1) * limit;

    let query = this.model
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select(select)
      .lean();

    if (populate.length) {
      populate.forEach((item) => {
        query = query.populate(item);
      });
    }

    const [items, total] = await Promise.all([
      query,
      this.model.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async updateById(id, payload, options = {}) {
    const document = await this.model.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
      ...options,
    });

    if (!document) {
      throw new ApiError(404, `${this.model.modelName} not found.`);
    }

    return document;
  }

  async updateOne(filter, payload, options = {}) {
    return this.model.findOneAndUpdate(filter, payload, {
      new: true,
      runValidators: true,
      ...options,
    });
  }

  async deleteById(id) {
    const document = await this.model.findByIdAndDelete(id);

    if (!document) {
      throw new ApiError(404, `${this.model.modelName} not found.`);
    }

    return document;
  }

  async deleteMany(filter = {}) {
    return this.model.deleteMany(filter);
  }

  async count(filter = {}) {
    return this.model.countDocuments(filter);
  }

  async exists(filter = {}) {
    return this.model.exists(filter);
  }

  async aggregate(pipeline = []) {
    return this.model.aggregate(pipeline);
  }

  async softDelete(id) {
    const document = await this.model.findByIdAndUpdate(
      id,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      {
        new: true,
      }
    );

    if (!document) {
      throw new ApiError(404, `${this.model.modelName} not found.`);
    }

    return document;
  }

  async restore(id) {
    const document = await this.model.findByIdAndUpdate(
      id,
      {
        isDeleted: false,
        deletedAt: null,
      },
      {
        new: true,
      }
    );

    if (!document) {
      throw new ApiError(404, `${this.model.modelName} not found.`);
    }

    return document;
  }
}

export default BaseService;