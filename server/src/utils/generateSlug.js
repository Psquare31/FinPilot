import mongoose from "mongoose";
import slugify from "slugify";

const generateSlug = async (modelName, value, currentId = null) => {
  const Model = mongoose.models[modelName];

  if (!Model) {
    throw new Error(`Model "${modelName}" is not registered.`);
  }

  const baseSlug = slugify(value, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingDocument = await Model.findOne({ slug }).select("_id");

    if (!existingDocument) {
      break;
    }

    if (
      currentId &&
      existingDocument._id.toString() === currentId.toString()
    ) {
      break;
    }

    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

export default generateSlug;