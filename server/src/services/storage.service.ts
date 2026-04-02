import { createClient } from '@supabase/supabase-js';

let _supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY env vars are required');
    }
    _supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  }
  return _supabase;
}

const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';

export class StorageService {
  async uploadFile(file: Express.Multer.File, folder: string, userId: string): Promise<string> {
    const ext = file.mimetype.split('/')[1] || 'jpg';
    const filename = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await getSupabase().storage
      .from(BUCKET)
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
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
