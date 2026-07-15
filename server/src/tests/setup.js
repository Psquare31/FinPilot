import mongoose from "mongoose";

// These hooks drop collections between tests. Refuse to run against anything
// that is not an obviously disposable local test database.
const assertDisposable = (uri) => {
  const isLocal = /(^mongodb:\/\/)(127\.0\.0\.1|localhost|mongo)(:|\/)/.test(uri);

  if (!isLocal || !/test/i.test(uri)) {
    throw new Error(
      `Refusing to run tests against "${uri}". The suite wipes collections ` +
        `between tests; point MONGO_URI_TEST at a local database whose name ` +
        `contains "test".`
    );
  }
};

beforeAll(async () => {
  const uri = process.env.MONGO_URI;

  assertDisposable(uri);

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  // Build indexes up-front so unique constraints are actually enforced during
  // tests rather than only in production.
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.syncIndexes())
  );
});

// Each test starts from an empty database, so ordering cannot leak state and
// produce passes that depend on another test's writes.
afterEach(async () => {
  const { collections } = mongoose.connection;

  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();
});
