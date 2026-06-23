import cloudinary from "../config/cloudinary";

export const uploadImage = async (
  file: Buffer | string,
  folder = "uploads"
) => {
  try {
    // If file is a Buffer, convert to base64 data URI
    const uploadData = Buffer.isBuffer(file)
      ? `data:image/jpeg;base64,${file.toString("base64")}`
      : file;

    const result = await cloudinary.uploader.upload(uploadData, {
      folder,
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw error;
  }
};

export const deleteImage = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw error;
  }
};

export const getImageUrl = (
  publicId: string,
  transformations?: Record<string, any>
) => {
  return cloudinary.url(publicId, {
    secure: true,
    ...transformations,
  });
};