import mongoose from "mongoose";

// ======================================================
// Check if ObjectId is valid.
// ======================================================

export const isValidObjectId = (value) => {
    return mongoose.Types.ObjectId.isValid(value);
};

// ======================================================
// Convert value to ObjectId.
// ======================================================

export const toObjectId = (value) => {
    return new mongoose.Types.ObjectId(value);
};

// ======================================================
// Compare two ObjectIds.
// ======================================================

export const objectIdsEqual = (
    first,
    second
) => {
    if (!first || !second) {
        return false;
    }

    return first.toString() === second.toString();
};