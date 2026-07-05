import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // Convert unknown errors into ApiError
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || "Internal Server Error";

        error = new ApiError(
            statusCode,
            message,
            error.errors || [],
            error.code || null
        );
    }

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        error = new ApiError(
            400,
            "Validation failed.",
            Object.values(err.errors).map((e) => e.message)
        );
    }

    // Invalid ObjectId
    if (err.name === "CastError") {
        error = new ApiError(
            400,
            `Invalid ${err.path}.`
        );
    }

    // Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];

        error = new ApiError(
            409,
            `${field} already exists.`
        );
    }

    return res.status(error.statusCode).json({
        success: false,
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors,
        timestamp: error.timestamp,
        ...(process.env.NODE_ENV === "development" && {
            stack: error.stack,
        }),
    });
};

export default errorHandler;