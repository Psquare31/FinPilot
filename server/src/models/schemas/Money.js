import mongoose from "mongoose";

const { Schema } = mongoose;

const moneySchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

export default moneySchema;