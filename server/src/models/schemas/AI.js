import mongoose from "mongoose";

const { Schema } = mongoose;

const aiSchema = new Schema(
  {
    categorized: {
      type: Boolean,
      default: false,
    },

    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },

    reasoning: {
      type: String,
      default: "",
    },

    suggestedCategory: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

export default aiSchema;