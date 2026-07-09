export default {
  testEnvironment: "node",

  verbose: true,

  testMatch: [
    "**/tests/**/*.test.js",
  ],

  collectCoverage: true,

  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/seeds/**",
  ],

  setupFilesAfterEnv: [
    "<rootDir>/tests/setup.js",
  ],

  transform: {},
};