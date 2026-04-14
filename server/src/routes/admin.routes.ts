import { Router, Request, Response } from 'express';
import prisma from '../data-source';
import { adminPanelAuth } from '../middlewares/adminPanel.middleware';
import { notify } from '../utils/notificationDispatcher';

const router = Router();
router.use(adminPanelAuth);

// ─── Helper: render full HTML page ───────────────────────────────────────────
function page(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — ChalParo Admin</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f4f8;color:#1a202c;min-height:100vh}
    .nav{background:#0d1b4b;padding:14px 24px;display:flex;align-items:center;gap:16px;position:sticky;top:0;z-index:10}
    .nav-brand{color:#fff;font-size:18px;font-weight:800;text-decoration:none}
    .nav a{color:rgba(255,255,255,0.75);text-decoration:none;font-size:13px;padding:6px 12px;border-radius:8px}
    .nav a:hover,.nav a.active{background:rgba(255,255,255,0.12);color:#fff}
    .container{max-width:1100px;margin:32px auto;padding:0 20px}
    h1{font-size:22px;font-weight:800;color:#0d1b4b;margin-bottom:24px}
    .stats{display:flex;gap:16px;margin-bottom:32px;flex-wrap:wrap}
    .stat-card{background:#fff;border-radius:14px;padding:20px 24px;flex:1;min-width:160px;border-left:4px solid var(--c);box-shadow:0 2px 8px rgba(0,0,0,0.06)}
    .stat-card .val{font-size:28px;font-weight:900;color:var(--c)}
    .stat-card .lbl{font-size:12px;color:#718096;margin-top:4px}
    .card{background:#fff;border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
    .card-header{display:flex;align-items:center;gap:12px;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid #e2e8f0}
    .badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700}
    .badge-pending{background:#fff8e1;color:#b45309}
    .badge-approved{background:#e8f5e9;color:#2e7d32}
    .badge-rejected{background:#fef2f2;color:#c62828}
    .badge-none{background:#f5f5f5;color:#666}
    .user-info{flex:1}
    .user-name{font-size:16px;font-weight:700;color:#0d1b4b}
    .user-meta{font-size:12px;color:#718096;margin-top:2px}
    .img-row{display:flex;gap:12px;margin:16px 0;flex-wrap:wrap}
    .img-box{position:relative}
    .img-box img{width:200px;height:130px;object-fit:cover;border-radius:10px;border:1.5px solid #e2e8f0;cursor:pointer}
    .img-box img:hover{opacity:0.9}
    .img-label{font-size:11px;color:#718096;margin-top:4px;text-align:center}
    .cnic-num{font-family:monospace;font-size:14px;background:#f7f8fa;padding:6px 12px;border-radius:8px;display:inline-block;margin:8px 0;letter-spacing:1px}
    .action-row{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
    form{display:contents}
    .btn{padding:10px 20px;border-radius:10px;border:none;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;text-decoration:none}
    .btn-approve{background:#2e7d32;color:#fff}
    .btn-approve:hover{background:#1b5e20}
    .btn-reject{background:#c62828;color:#fff}
    .btn-reject:hover{background:#b71c1c}
    .btn-outline{background:#fff;color:#0d1b4b;border:1.5px solid #cbd5e0}
    input[name=reason]{flex:1;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:13px;min-width:200px}
    input[name=reason]:focus{outline:none;border-color:#1a73e8}
    .empty{text-align:center;padding:60px 20px;color:#a0aec0}
    .empty-icon{font-size:48px;margin-bottom:12px}
    .alert{padding:12px 18px;border-radius:10px;margin-bottom:20px;font-size:14px;font-weight:600}
    .alert-success{background:#e8f5e9;color:#2e7d32}
    .alert-error{background:#fef2f2;color:#c62828}
    .section-tabs{display:flex;gap:8px;margin-bottom:24px}
    .tab-btn{padding:8px 18px;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;color:#718096;background:#fff;border:1.5px solid #e2e8f0}
    .tab-btn.active{background:#0d1b4b;color:#fff;border-color:#0d1b4b}
    /* Lightbox */
    .lightbox{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:999;align-items:center;justify-content:center}
    .lightbox.open{display:flex}
    .lightbox img{max-width:90vw;max-height:90vh;border-radius:8px}
    .lightbox-close{position:fixed;top:20px;right:24px;color:#fff;font-size:32px;cursor:pointer;line-height:1}
  </style>
</head>
<body>
<nav class="nav">
  <a href="/admin" class="nav-brand">🚗 ChalParo Admin</a>
  <a href="/admin" ${title === 'Dashboard' ? 'class="active"' : ''}>Dashboard</a>
  <a href="/admin/verifications?filter=cnic" ${title === 'CNIC Verifications' ? 'class="active"' : ''}>CNIC</a>
  <a href="/admin/verifications?filter=licence" ${title === 'Licence Verifications' ? 'class="active"' : ''}>Licences</a>
</nav>

<!-- Lightbox -->
<div class="lightbox" id="lb" onclick="document.getElementById('lb').classList.remove('open')">
  <span class="lightbox-close">✕</span>
  <img id="lb-img" src="" />
</div>
<script>
  function openImg(src){document.getElementById('lb-img').src=src;document.getElementById('lb').classList.add('open')}
</script>

<div class="container">
  <h1>${title}</h1>
  ${body}
</div>
</body></html>`;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/', async (_req: Request, res: Response) => {
  const [pendingCnic, pendingLicence, approvedCnic, approvedLicence, totalUsers] = await Promise.all([
    prisma.userVerification.count({ where: { cnicStatus: 'PENDING', cnicFront: { not: null } } }),
    prisma.userVerification.count({ where: { licenceStatus: 'PENDING', licenceImage: { not: null } } }),
    prisma.userVerification.count({ where: { cnicStatus: 'APPROVED' } }),
    prisma.userVerification.count({ where: { licenceStatus: 'APPROVED' } }),
    prisma.user.count(),
  ]);

  const body = `
    <div class="stats">
      <div class="stat-card" style="--c:#e65100">
        <div class="val">${pendingCnic}</div><div class="lbl">Pending CNIC</div>
      </div>
      <div class="stat-card" style="--c:#1565c0">
        <div class="val">${pendingLicence}</div><div class="lbl">Pending Licences</div>
      </div>
      <div class="stat-card" style="--c:#2e7d32">
        <div class="val">${approvedCnic}</div><div class="lbl">CNIC Approved</div>
      </div>
      <div class="stat-card" style="--c:#6a1b9a">
        <div class="val">${approvedLicence}</div><div class="lbl">Licences Approved</div>
      </div>
      <div class="stat-card" style="--c:#0d1b4b">
        <div class="val">${totalUsers}</div><div class="lbl">Total Users</div>
      </div>
    </div>

    <div style="display:flex;gap:16px;flex-wrap:wrap">
      <a href="/admin/verifications?filter=cnic" class="btn btn-outline" style="font-size:15px;padding:14px 24px">
        🪪 Review CNIC (${pendingCnic} pending)
      </a>
      <a href="/admin/verifications?filter=licence" class="btn btn-outline" style="font-size:15px;padding:14px 24px">
        🚗 Review Licences (${pendingLicence} pending)
      </a>
    </div>
  `;
  res.send(page('Dashboard', body));
});

// ─── Verifications List ────────────────────────────────────────────────────────
router.get('/verifications', async (req: Request, res: Response) => {
  const filter  = (req.query.filter as string) || 'cnic';
  const showAll = req.query.all === '1';
  const isCnic  = filter === 'cnic';

  const where: any = isCnic
    ? { cnicFront: { not: null }, ...(showAll ? {} : { cnicStatus: 'PENDING' }) }
    : { licenceImage: { not: null }, ...(showAll ? {} : { licenceStatus: 'PENDING' }) };

  const records = await prisma.userVerification.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } },
    orderBy: { updatedAt: 'asc' },
  });

  const msg = req.query.msg as string | undefined;
  const err = req.query.err as string | undefined;
  const title = isCnic ? 'CNIC Verifications' : 'Licence Verifications';

  const rows = records.map((r: any) => {
    const u = r.user;
    const status = isCnic ? r.cnicStatus : r.licenceStatus;
    const badgeCls = status === 'APPROVED' ? 'badge-approved' : status === 'REJECTED' ? 'badge-rejected' : 'badge-pending';

    const images = isCnic
      ? [
          r.cnicFront  ? `<div class="img-box"><img src="${r.cnicFront}"  onclick="openImg('${r.cnicFront}')" /><div class="img-label">Front</div></div>` : '',
          r.cnicBack   ? `<div class="img-box"><img src="${r.cnicBack}"   onclick="openImg('${r.cnicBack}')"  /><div class="img-label">Back</div></div>` : '',
        ].join('')
      : r.licenceImage ? `<div class="img-box"><img src="${r.licenceImage}" onclick="openImg('${r.licenceImage}')" /><div class="img-label">Licence</div></div>` : '';

    const cnicNum = isCnic && r.cnicNumber ? `<div class="cnic-num">🪪 ${r.cnicNumber}</div>` : '';

    const actions = (status === 'PENDING') ? `
      <div class="action-row">
        <form method="POST" action="/admin/review/${r.id}" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;flex:1">
          <input type="hidden" name="type" value="${filter}" />
          <input type="hidden" name="userId" value="${u.id}" />
          <input type="text" name="reason" placeholder="Rejection reason (optional for approve)" />
          <button type="submit" name="action" value="APPROVED" class="btn btn-approve">✓ Approve</button>
          <button type="submit" name="action" value="REJECTED" class="btn btn-reject" onclick="return confirm('Reject this verification?')">✗ Reject</button>
        </form>
      </div>` : `<div style="margin-top:12px;font-size:12px;color:#718096">${r.rejectedReason ? '❌ Reason: ' + r.rejectedReason : '✓ No further action needed'}</div>`;

    return `
      <div class="card">
        <div class="card-header">
          <div style="width:44px;height:44px;border-radius:50%;background:#0d1b4b;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:16px;flex-shrink:0">
            ${u.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div class="user-info">
            <div class="user-name">${u.name} <span style="font-size:11px;color:#718096;font-weight:500">(${u.role})</span></div>
            <div class="user-meta">${u.email} &nbsp;•&nbsp; ${u.phone || 'No phone'}</div>
          </div>
          <span class="badge ${badgeCls}">${status}</span>
        </div>
        ${cnicNum}
        <div class="img-row">${images}</div>
        ${actions}
      </div>`;
  }).join('');

  const body = `
    ${msg ? `<div class="alert alert-success">✓ ${msg}</div>` : ''}
    ${err ? `<div class="alert alert-error">✗ ${err}</div>` : ''}

    <div class="section-tabs">
      <a href="/admin/verifications?filter=cnic"         class="tab-btn ${isCnic  && !showAll ? 'active' : ''}">Pending CNIC</a>
      <a href="/admin/verifications?filter=cnic&all=1"   class="tab-btn ${isCnic  && showAll  ? 'active' : ''}">All CNIC</a>
      <a href="/admin/verifications?filter=licence"      class="tab-btn ${!isCnic && !showAll ? 'active' : ''}">Pending Licences</a>
      <a href="/admin/verifications?filter=licence&all=1" class="tab-btn ${!isCnic && showAll  ? 'active' : ''}">All Licences</a>
    </div>

    ${records.length === 0
      ? `<div class="empty"><div class="empty-icon">🎉</div><div>No ${showAll ? '' : 'pending '}${isCnic ? 'CNIC' : 'licence'} verifications</div></div>`
      : rows
    }
  `;

  res.send(page(title, body));
});

// ─── Review Action (POST) ──────────────────────────────────────────────────────
router.post('/review/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, type, userId, reason } = req.body as {
    action: 'APPROVED' | 'REJECTED';
    type: 'cnic' | 'licence';
    userId: string;
    reason?: string;
  };
  const isCnic = type === 'cnic';

  try {
    const dataUpdate: any = isCnic
      ? { cnicStatus: action, rejectedReason: action === 'REJECTED' ? (reason || 'Did not meet requirements') : null }
      : { licenceStatus: action, rejectedReason: action === 'REJECTED' ? (reason || 'Did not meet requirements') : null };

    await prisma.userVerification.update({ where: { id: id as string }, data: dataUpdate });

    // If CNIC approved, mark user isVerified
    if (isCnic && action === 'APPROVED') {
      await prisma.user.update({ where: { id: userId }, data: { isVerified: true } });
    }

    // Notify the user
    const notifTitle = action === 'APPROVED'
      ? (isCnic ? 'CNIC Verified ✓' : 'Driving Licence Verified ✓')
      : (isCnic ? 'CNIC Verification Failed ✗' : 'Licence Verification Failed ✗');

    const notifMessage = action === 'APPROVED'
      ? (isCnic
          ? 'Your CNIC has been verified. Your profile now shows the CNIC Verified badge!'
          : 'Your driving licence has been verified. You can now post rides with confidence.')
      : `Your ${isCnic ? 'CNIC' : 'driving licence'} could not be verified. Reason: ${reason || 'Did not meet requirements'}. Please resubmit with clearer images.`;

    await notify({
      userId,
      title: notifTitle,
      message: notifMessage,
      type: 'SYSTEM' as any,
    });

    const redirectFilter = isCnic ? 'cnic' : 'licence';
    res.redirect(`/admin/verifications?filter=${redirectFilter}&msg=${encodeURIComponent(`${action === 'APPROVED' ? 'Approved' : 'Rejected'} successfully`)}`);
  } catch (err: any) {
    res.redirect(`/admin/verifications?filter=${isCnic ? 'cnic' : 'licence'}&err=${encodeURIComponent(err.message || 'Action failed')}`);
  }
});

export default router;
