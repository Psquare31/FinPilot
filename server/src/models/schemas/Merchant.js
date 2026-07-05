import mongoose from "mongoose";

const { Schema } = mongoose;

const merchantSchema = new Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      default: "business",
    },

    website: {
      type: String,
      default: "",
    },

    contact: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

export default merchantSchema;