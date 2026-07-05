import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";

const validate = (schema) => {
    return async (req, res, next) => {
        try {
            req.validatedData = await schema.parseAsync({
                body: req.body,
                params: req.params,
                query: req.query,
            });

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return next(
                    new ApiError(
                        400,
                        "Validation failed.",
                        error.issues.map((issue) => ({
                            field: issue.path.join("."),
                            message: issue.message,
                        })),
                        "VALIDATION_ERROR"
                    )
                );
            }

            next(error);
        }
    };
};

export default validate;