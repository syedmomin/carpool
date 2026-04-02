import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';

const IMAGE_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (IMAGE_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Only image files (JPEG, PNG, WEBP) are allowed') as any;
    error.status = 400;
    cb(error);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});
