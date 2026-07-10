import mongoose from "mongoose";

import { RECURRENCE_FREQUENCIES } from "../../constants/transactionTypes.js";

const { Schema } = mongoose;

const recurringSchema = new Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },

    frequency: {
      type: String,
      enum: RECURRENCE_FREQUENCIES,
      default: "monthly",
    },

    interval: {
      type: Number,
      default: 1,
      min: 1,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },

    nextRun: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

export default recurringSchema;