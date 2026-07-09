import mongoose from "mongoose";

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
};

export const closeDatabase = async () => {
  await mongoose.connection.close();
};