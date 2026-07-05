class ApiResponse {
    constructor(
        statusCode,
        data = null,
        message = "Request completed successfully.",
        meta = null
    ) {
        this.success = statusCode >= 200 && statusCode < 300;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.meta = meta;
        this.timestamp = new Date().toISOString();
    }
}

export default ApiResponse;