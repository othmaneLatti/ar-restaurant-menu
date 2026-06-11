import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadItemFiles = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      if (file.fieldname === 'thumbnail') {
        return { folder: 'ar-menu/thumbnails' };
      } else if (file.fieldname === 'model') {
        return { folder: 'ar-menu/models', resource_type: 'raw', format: 'glb' } as any;
      }
      return { folder: 'ar-menu/misc' };
    },
  }),
});
