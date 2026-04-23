import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';
import { getSupabase } from '../utils/supabase';
import { ResponseUtil } from '../utils/response';

const router = Router();

const BUCKET = process.env.SUPABASE_BUCKET || 'uploads';
const VALID_TYPES = ['profile', 'vehicle', 'documents'] as const;
type UploadType = typeof VALID_TYPES[number];

function handleUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
        ResponseUtil.badRequest(res, 'File too large. Maximum size is 10MB');
      } else {
        ResponseUtil.badRequest(res, err.message || 'Invalid file');
      }
      return;
    }
    next();
  });
}

router.post('/image', authenticate, handleUpload, async (req: Request, res: Response) => {
  if (!req.file) { ResponseUtil.badRequest(res, 'No file uploaded'); return; }

  const userId = (req as any).user?.id;
  const type: UploadType = VALID_TYPES.includes(req.query.type as UploadType)
    ? (req.query.type as UploadType)
    : 'profile';

  const ext      = req.file.mimetype.split('/')[1] || 'jpg';
  const filename = `${userId}/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await getSupabase().storage
    .from(BUCKET)
    .upload(filename, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error('❌ Supabase Upload Error:', error);
    ResponseUtil.error(res, error.message || 'Storage upload failed');
    return;
  }

  const { data } = getSupabase().storage.from(BUCKET).getPublicUrl(filename);
  ResponseUtil.created(res, { url: data.publicUrl }, 'Image uploaded successfully');
});

export default router;
