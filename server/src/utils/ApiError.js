class ApiError extends Error {
    constructor(
        statusCode,
        message = "API Error --- An unexpected error occurred.",
        errors = [],
        code = null,
        stack = ""
    ) {
        super(message);

        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.success = false;
        this.message = message;
        this.errors = errors;
        this.code = code;
        this.timestamp = new Date().toISOString();

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;