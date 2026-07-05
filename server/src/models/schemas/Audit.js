import mongoose from "mongoose";

const { Schema } = mongoose;

const auditSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    archivedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

export default auditSchema;