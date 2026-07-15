import mongoose from "mongoose";

import ApiError from "./ApiError.js";

/**
 * Cast a value to an ObjectId for use inside an aggregation pipeline.
 *
 * find()/countDocuments() cast query values against the schema automatically,
 * but aggregate() does not — a `$match` on a string will silently match zero
 * documents against an ObjectId field, producing an empty result rather than
 * an error. Any workspace/user id entering a pipeline from req.query or
 * req.params must be cast explicitly.
 */
const toObjectId = (value, field = "id") => {
  if (value instanceof mongoose.Types.ObjectId) {
    return value;
  }

  if (!mongoose.isValidObjectId(value)) {
    throw new ApiError(400, `Invalid ${field}.`);
  }

  return new mongoose.Types.ObjectId(String(value));
};

export default toObjectId;
