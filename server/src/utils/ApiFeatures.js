class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };

    const excludedFields = [
      "page",
      "limit",
      "sort",
      "fields",
      "search",
      "populate",
    ];

    excludedFields.forEach((field) => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|in|nin|ne|regex)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  search(searchFields = []) {
    if (
      this.queryString.search &&
      Array.isArray(searchFields) &&
      searchFields.length
    ) {
      const keyword = this.queryString.search.trim();

      this.query = this.query.find({
        $or: searchFields.map((field) => ({
          [field]: {
            $regex: keyword,
            $options: "i",
          },
        })),
      });
    }

    return this;
  }

  sort(defaultSort = "-createdAt") {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");

      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort(defaultSort);
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");

      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = Math.max(Number(this.queryString.page) || 1, 1);

    const limit = Math.max(Number(this.queryString.limit) || 10, 1);

    const skip = (page - 1) * limit;

    this.page = page;
    this.limit = limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  populate() {
    if (!this.queryString.populate) {
      return this;
    }

    const paths = this.queryString.populate.split(",");

    paths.forEach((path) => {
      this.query = this.query.populate(path.trim());
    });

    return this;
  }

  lean() {
    this.query = this.query.lean();

    return this;
  }

  async execute() {
    return this.query.exec();
  }
}

export default ApiFeatures;