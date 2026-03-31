import { Router, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { createClient } from '@supabase/supabase-js';
import { authenticate } from '../middlewares/auth.middleware';
import { ResponseUtil } from '../utils/response';

const router = Router();

// ─── Supabase Storage Client (lazy — created on first request) ───────────────
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

const BUCKET = 'uploads';

// ─── Multer (memory storage — file goes to Supabase, not disk) ───────────────
const VALID_TYPES = ['profile', 'vehicle', 'documents'] as const;
type UploadType = typeof VALID_TYPES[number];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ─── POST /upload/image ───────────────────────────────────────────────────────
router.post('/image', authenticate, upload.single('image'), async (req: Request, res: Response) => {
  if (!req.file) { ResponseUtil.badRequest(res, 'No file uploaded'); return; }

  const userId  = (req as any).user?.id;
  const type: UploadType = VALID_TYPES.includes(req.query.type as UploadType)
    ? (req.query.type as UploadType)
    : 'profile';

  const ext      = req.file.mimetype.split('/')[1] || 'jpg';
  const filename = `${userId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert:      false,
    });

  if (error) { ResponseUtil.error(res, error.message); return; }

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(filename);

  ResponseUtil.created(res, { url: data.publicUrl }, 'Image uploaded successfully');
});

export default router;
