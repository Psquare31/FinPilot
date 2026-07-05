class ApiError extends Error {
    constructor(
        statusCode,
        message = "API Error --- An unexpected error occurred.",
        errors = [],
        stack = ""
    ) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);

        if (stack) {
            this.stack = stack;
        }
    }
}

export default ApiError;