import swaggerJSDoc from "swagger-jsdoc";

import env from "../env/index.js";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "FinPilot API",
            version: "1.0.0",
            description:
                "Personal Finance & Investment Analytics Platform — REST API.",
        },
        servers: [
            {
                url: `http://localhost:${env.PORT}/api/v1`,
                description: "Local development server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },

    // JSDoc @openapi comments are picked up from route and module files.
    apis: [
        "./src/routes/**/*.js",
        "./src/modules/**/*.js",
    ],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
