import { v2 as cloudinary } from "cloudinary";

import streamifier from "streamifier";

class StorageService {
  upload(buffer, folder = "finpilot") {
    return new Promise((resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }

            resolve(result);
          }
        );

      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  async delete(publicId) {
    return cloudinary.uploader.destroy(publicId);
  }
}

export default new StorageService();