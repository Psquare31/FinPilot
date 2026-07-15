export default {
  testEnvironment: "node",

  verbose: true,

  testMatch: ["**/src/tests/**/*.test.js"],

  collectCoverage: true,

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/seeds/**",
    "!src/tests/**",
  ],

  // Must run before any import: src/config/env/index.js validates the
  // environment at module load time and exits the process if a variable is
  // missing.
  setupFiles: ["<rootDir>/src/tests/env.setup.js"],

  // Previously "<rootDir>/tests/setup.js". The file is at src/tests/setup.js,
  // so jest aborted on a validation error and the suite never ran at all.
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],

  transform: {},
};
