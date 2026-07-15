// ======================================================
// Escape special regex characters.
// ======================================================

export const escapeRegex = (value = "") => {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// ======================================================
// Create case-insensitive exact match regex.
// ======================================================

export const exactMatchRegex = (value = "") => {
    return new RegExp(
        `^${escapeRegex(value.trim())}$`,
        "i"
    );
};

// ======================================================
// Create case-insensitive contains regex.
// ======================================================

export const containsRegex = (value = "") => {
    return new RegExp(
        escapeRegex(value.trim()),
        "i"
    );
};

// ======================================================
// Create starts with regex.
// ======================================================

export const startsWithRegex = (value = "") => {
    return new RegExp(
        `^${escapeRegex(value.trim())}`,
        "i"
    );
};

// ======================================================
// Create ends with regex.
// ======================================================

export const endsWithRegex = (value = "") => {
    return new RegExp(
        `${escapeRegex(value.trim())}$`,
        "i"
    );
};