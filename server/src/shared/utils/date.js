export const toDate = (value) => new Date(value);
export const isValidDate = (value) => !Number.isNaN(toDate(value).getTime());
