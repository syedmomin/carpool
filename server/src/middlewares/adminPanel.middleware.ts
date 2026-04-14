import { Request, Response, NextFunction } from 'express';

/**
 * Protects the admin panel with a secret key from .env (ADMIN_PANEL_KEY).
 * Access via: /admin?key=YOUR_SECRET  or  Cookie: adminKey=YOUR_SECRET
 */
export const adminPanelAuth = (req: Request, res: Response, next: NextFunction): void => {
  const secret = process.env.ADMIN_PANEL_KEY;
  if (!secret) {
    res.status(503).send('<h2>Admin panel disabled — set ADMIN_PANEL_KEY in .env</h2>');
    return;
  }

  // Accept key from query param (first visit) or session cookie
  const queryKey = req.query.key as string | undefined;
  // Parse cookies manually (no cookie-parser dependency needed)
  const cookieHeader = req.headers.cookie || '';
  const cookieKey = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('adminKey='))?.split('=')[1];

  if (queryKey === secret) {
    // Set a session cookie (httpOnly, 8 hours)
    res.cookie('adminKey', secret, {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: 'strict',
    });
    next();
    return;
  }

  if (cookieKey === secret) {
    next();
    return;
  }

  res.status(401).send(`
    <!DOCTYPE html><html><head><title>Admin Login</title>
    <style>
      body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0d1b4b;}
      .box{background:#fff;padding:40px;border-radius:16px;text-align:center;width:320px;}
      h2{margin:0 0 8px;color:#0d1b4b;}p{color:#666;font-size:13px;margin-bottom:24px;}
      input{width:100%;padding:12px;border:1.5px solid #ddd;border-radius:8px;font-size:14px;box-sizing:border-box;margin-bottom:14px;}
      button{width:100%;padding:12px;background:#1a73e8;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;}
    </style></head>
    <body><div class="box">
      <h2>🛡️ ChalParo Admin</h2>
      <p>Enter admin access key to continue</p>
      <form method="GET" action="${req.baseUrl}">
        <input type="password" name="key" placeholder="Admin key" autofocus />
        <button type="submit">Access Panel</button>
      </form>
    </div></body></html>
  `);
};
