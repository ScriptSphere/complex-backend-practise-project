import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_KEYSECRATE,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image",
        });
        // File has been uploaded successfully:
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        console.error(error);
        fs.unlinkSync(localFilePath); // remove the locally stored file as the upload operation got failed
        return;
    }
};

export { uploadOnCloudinary };
