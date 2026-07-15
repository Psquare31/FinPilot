export const getFileExtension = (filename = "") => filename.split(".").pop();
export const getFileName = (filename = "") => filename.replace(/\.[^/.]+$/, "");
