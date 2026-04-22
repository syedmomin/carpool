import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export const processImage = async (file: Express.Multer.File, type: 'avatar' | 'vehicle' | 'cnic' = 'vehicle') => {
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  const uploadDir = path.join(process.cwd(), 'uploads', type);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const outputPath = path.join(uploadDir, filename);

  let processor = sharp(file.buffer);

  if (type === 'avatar') {
    processor = processor.resize(200, 200, { fit: 'cover' });
  } else if (type === 'vehicle') {
    processor = processor.resize(800, 600, { fit: 'inside', withoutEnlargement: true });
  } else if (type === 'cnic') {
    processor = processor.resize(1200, 800, { fit: 'inside', withoutEnlargement: true });
  }

  await processor
    .webp({ quality: 80 })
    .toFile(outputPath);

  return `uploads/${type}/${filename}`;
};
