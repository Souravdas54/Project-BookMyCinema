import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinaryConfig';

export const CreateuploadFolder = (folderName: string) => {
    const storage = new CloudinaryStorage({
        cloudinary,
        params: async () => ({
            folder: folderName,
            // allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heif'],
            transformation: [{ width: 500, height: 500, crop: 'limit' }],

        }),
    });

    return multer({
        storage,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    });
}


// const upload = multer({
//     storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
// });

// export default upload;
