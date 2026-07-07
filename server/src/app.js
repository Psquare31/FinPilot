import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import env from "./config/env/index.js";
import { morganStream } from "./config/logger/logger.js";
import swaggerSpec from "./config/swagger/swagger.js";

import routes from "./routes/index.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());

app.use(
    cors({
        origin: env.CLIENT_URL,
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(compression());

// Strip MongoDB operator keys ($, .) from request bodies to guard
// against NoSQL injection. req.query is read-only under Express 5,
// so we only sanitize the mutable body here.
const sanitize = (value) => {
    if (Array.isArray(value)) {
        return value.map(sanitize);
    }

    if (value && typeof value === "object") {
        return Object.keys(value).reduce((acc, key) => {
            if (!key.startsWith("$") && !key.includes(".")) {
                acc[key] = sanitize(value[key]);
            }
            return acc;
        }, {});
    }

    return value;
};

app.use((req, res, next) => {
    if (req.body && typeof req.body === "object") {
        req.body = sanitize(req.body);
    }
    next();
});

// ======================================================
// Request logging
// ======================================================

app.use(
    morgan(env.isProduction ? "combined" : "dev", {
        stream: morganStream,
    })
);

// ======================================================
// API documentation
// ======================================================

app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "FinPilot API Docs",
    })
);

// ======================================================
// Routes
// ======================================================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "FinPilot API",
        version: "v1",
        docs: "/api/docs",
    });
});

app.use("/api/v1", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
