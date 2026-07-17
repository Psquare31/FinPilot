export const USER_THEMES = [
    "light",
    "dark",
    "system",
];

// Restored: the layered-architecture refactor removed this constant, but 14
// files still import it — including the Account, User and Workspace models,
// where it backs the `currency` enum. Every module that imports it failed to
// load with "does not provide an export named 'USER_CURRENCIES'", which meant
// the server could not start at all.
export const USER_CURRENCIES = [
    "INR",
    "USD",
    "EUR",
    "GBP",
    "JPY",
];

export const USER_AUTH_PROVIDERS = [
    "EMAIL",
    "GOOGLE",
    "MICROSOFT",
    "APPLE",
];

export const USER_STATUSES = [
    "ACTIVE",
    "SUSPENDED",
    "DELETED",
];