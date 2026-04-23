import sharp from 'sharp';
import { getSupabase } from '../utils/supabase';

const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

export class StorageService {
  async uploadFile(file: Express.Multer.File, folder: string, userId: string): Promise<string> {
    const filename = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

    let processedBuffer: Buffer = file.buffer;
    try {
      let processor = sharp(file.buffer);

      if (folder === 'avatar') {
        processor = processor.resize(300, 300, { fit: 'cover' });
      } else {
        processor = processor.resize(1200, 1200, { fit: 'inside', withoutEnlargement: true });
      }

      processedBuffer = await processor.webp({ quality: 80, effort: 3 }).toBuffer();
    } catch (err) {
      console.warn('[StorageService] Image processing failed, uploading original:', err);
    }

    const { error } = await getSupabase().storage
      .from(BUCKET)
      .upload(filename, processedBuffer, {
        contentType: 'image/webp',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase Upload Error:', error);
      throw new Error(error.message || 'Storage upload failed');
    }

    const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(filename);
    return data.publicUrl;
  }

  async uploadMultiple(files: Express.Multer.File[], folder: string, userId: string): Promise<string[]> {
    if (!files || files.length === 0) return [];
    return Promise.all(files.map(file => this.uploadFile(file, folder, userId)));
  }
}

export const storageService = new StorageService();
