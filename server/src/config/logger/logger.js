import winston from "winston";

import env from "../env/index.js";

const { combine, timestamp, printf, colorize, errors, json } =
    winston.format;

// Human-friendly single-line format for local development.
const devFormat = combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    printf(({ level, message, timestamp: ts, stack }) => {
        return `${ts} [${level}]: ${stack || message}`;
    })
);

// Structured JSON for production log aggregation.
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    json()
);

const logger = winston.createLogger({
    level: env.isProduction ? "info" : "debug",
    format: env.isProduction ? prodFormat : devFormat,
    defaultMeta: { service: "finpilot-api" },
    transports: [new winston.transports.Console()],
    exitOnError: false,
});

// Stream adapter so Morgan writes HTTP logs through Winston.
export const morganStream = {
    write: (message) => logger.http(message.trim()),
};

export default logger;
