import mongoose from "mongoose";

// A multi-document transaction requires a replica set or mongos. A plain
// standalone `mongod` (the common local / demo setup) rejects it with
// "Transaction numbers are only allowed on a replica set member or mongos".
const isTransactionUnsupported = (error) => {
  if (!error) return false;

  const message = String(error.message || "");

  return (
    error.code === 20 ||
    error.codeName === "IllegalOperation" ||
    /replica set member or mongos/i.test(message) ||
    /Transaction numbers are only allowed/i.test(message)
  );
};

const withTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const result = await callback(session);

    await session.commitTransaction();

    return result;
  } catch (error) {
    await session.abortTransaction().catch(() => {});

    // Nothing was committed, so it is safe to retry the same work without a
    // session on deployments that don't support transactions.
    if (isTransactionUnsupported(error)) {
      return callback(undefined);
    }

    throw error;
  } finally {
    await session.endSession();
  }
};

export default withTransaction;
