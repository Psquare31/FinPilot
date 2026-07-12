import crypto from "crypto";
export const hash = (value, algorithm = "sha256") => crypto.createHash(algorithm).update(String(value)).digest("hex");
