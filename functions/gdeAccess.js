'use strict';

/**
 * GDE access control.
 *
 * On first Google sign-in the user's profile name and email are matched against the public
 * GDE directory (me.developers.google.com/communities/experts) with a 90% similarity threshold:
 *   - >= 90% match     -> status "validated" (admin gets an FYI email with a Block link)
 *   - < 90% match      -> status "unverified" ("Unable to validate") -> user clicks "Ask for Access"
 *                         -> status "pending" and admin gets an email with signed Allow / Block links
 *   - admin decision   -> status "approved" or "blocked"
 *
 * Statuses live in Firestore `gde_access/{uid}` and are written only by this server code.
 * Firestore rules and the API routes allow app data access only for "validated" / "approved".
 */

const crypto = require('crypto');

const ACCESS_COLLECTION = 'gde_access';
const ACCESS_REQUESTS_COLLECTION = 'gde_access_requests';
const ALLOWED_STATUSES = new Set(['validated', 'approved']);
const MATCH_THRESHOLD = 0.9;

// Obfuscated default admin emails (plaintext values live in gitignored functions/.env)
const DEFAULT_PRIMARY_ADMIN = Buffer.from('YW5kcmVAYW5kcmVzYXJhLmlv', 'base64').toString('utf8');
const DEFAULT_SECONDARY_ADMIN = Buffer.from('YW5kcmVzYXJhQGdtYWlsLmNvbQ==', 'base64').toString(
  'utf8',
);

const ADMIN_EMAILS = String(
  process.env.GDE_ADMIN_EMAILS || `${DEFAULT_PRIMARY_ADMIN},${DEFAULT_SECONDARY_ADMIN}`,
)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_NOTIFY_EMAIL = process.env.GDE_ADMIN_NOTIFY_EMAIL || DEFAULT_PRIMARY_ADMIN;
const SMTP_USER = process.env.GDE_SMTP_USER || DEFAULT_PRIMARY_ADMIN;
const APP_BASE_URL = (process.env.GDE_APP_BASE_URL || 'https://gde.web.app').replace(/\/$/, '');
const DECISION_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 24 * 60 * 60 * 1000;
// Users whose gde_users profile existed before access control went live keep their access.
const GRANDFATHER_CUTOFF_MS = Date.parse('2026-11-09T00:00:00Z');
const SECRET_NAMES = ['GDE_ACCESS_SIGNING_KEY'];

const GENERIC_EMAIL_DOMAINS = new Set([
  'gmail',
  'google',
  'googlemail',
  'yahoo',
  'outlook',
  'hotmail',
  'icloud',
  'proton',
  'protonmail',
  'me',
  'live',
  'msn',
  'aol',
]);

// ---------------------------------------------------------------------------
// 90% fuzzy name + email matching against the GDE directory
// ---------------------------------------------------------------------------

function nameTokens(raw) {
  return String(raw || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)|（[^）]*）/g, ' ')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function compactName(raw) {
  return nameTokens(raw).join('');
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array(b.length + 1);
  for (let i = 0; i < a.length; i++) {
    curr[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr[j + 1] = Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function stringSimilarity(a, b) {
  const sa = String(a || '');
  const sb = String(b || '');
  const maxLen = Math.max(sa.length, sb.length);
  if (maxLen === 0) return 0;
  return 1 - levenshteinDistance(sa, sb) / maxLen;
}

/**
 * Directory records are arrays: p[0] profile id, p[1] display name, p[2] avatar,
 * p[11] [.., .., countryCode, location], p[12] github, p[14] linkedin, p[16] twitter,
 * p[17] profile handle (me.developers.google.com/u/<handle>).
 *
 * Matches when the user's display name or email achieves >= 90% similarity against
 * a GDE directory entry's full display name (2+ words) or profile handle (6+ chars).
 */
function matchGdeByName(experts, googleName, email = '') {
  const tokens = nameTokens(googleName);
  const target = tokens.join('');
  const targetSorted = [...tokens].sort().join(' ');

  const emailRaw = String(email || '')
    .trim()
    .toLowerCase();
  const [rawLocal = '', rawHost = ''] = emailRaw.split('@');
  const emailLocal = compactName(rawLocal);
  const emailDomain = compactName(rawHost.split('.')[0] || '');
  const hasCustomDomain =
    emailDomain.length >= 6 && !GENERIC_EMAIL_DOMAINS.has(emailDomain);
  const hasStrongEmailLocal = emailLocal.length >= 6;

  if (target.length < 4 && !hasCustomDomain && !hasStrongEmailLocal) {
    return null;
  }

  let bestMatch = null;
  let bestScore = 0;

  for (const item of experts || []) {
    const p = (item && item[0]) || [];
    const dispTokens = nameTokens(p[1]);
    const dispCompact = dispTokens.join('');
    const dispSorted = [...dispTokens].sort().join(' ');
    const handle = compactName(p[17]);
    const gh = compactName(p[12]);
    const tw = compactName(p[16]);

    let candidateScore = 0;
    let matchedOn = '';

    // 1. Full display name similarity (requires 2+ tokens on directory entry and 4+ chars on target)
    if (dispTokens.length >= 2 && target.length >= 4 && tokens.length >= 2) {
      const sim = Math.max(
        stringSimilarity(target, dispCompact),
        stringSimilarity(targetSorted, dispSorted),
      );
      if (sim > candidateScore) {
        candidateScore = sim;
        matchedOn = 'name';
      }
    }

    // 2. Directory handle similarity (requires 6+ char handle and 2+ name tokens or 6+ char target)
    if (handle.length >= 6 && target.length >= 6 && tokens.length >= 2) {
      const sim = stringSimilarity(target, handle);
      if (sim > candidateScore) {
        candidateScore = sim;
        matchedOn = 'handle';
      }
    }

    // 3. Email local-part / custom domain similarity against directory handle or full display name
    if (hasStrongEmailLocal) {
      const handleEmailSim = handle.length >= 6 ? stringSimilarity(emailLocal, handle) : 0;
      const dispEmailSim =
        dispTokens.length >= 2 ? stringSimilarity(emailLocal, dispCompact) : 0;
      const socialSim = Math.max(
        gh.length >= 6 ? stringSimilarity(emailLocal, gh) : 0,
        tw.length >= 6 ? stringSimilarity(emailLocal, tw) : 0,
      );
      const emailSim = Math.max(handleEmailSim, dispEmailSim, socialSim);
      if (emailSim > candidateScore) {
        candidateScore = emailSim;
        matchedOn = 'email';
      }
    }

    if (hasCustomDomain) {
      const domainSim = Math.max(
        handle.length >= 6 ? stringSimilarity(emailDomain, handle) : 0,
        dispTokens.length >= 2 ? stringSimilarity(emailDomain, dispCompact) : 0,
      );
      if (domainSim > candidateScore) {
        candidateScore = domainSim;
        matchedOn = 'email';
      }
    }

    if (candidateScore > bestScore) {
      bestScore = candidateScore;
      bestMatch = {
        matchedOn,
        similarity: Math.round(candidateScore * 100) / 100,
        profile: formatDirectoryProfile(p),
      };
      if (bestScore === 1) break;
    }
  }

  return bestScore >= MATCH_THRESHOLD ? bestMatch : null;
}

function formatDirectoryProfile(p) {
  const handle = String(p[17] || '');
  const loc = Array.isArray(p[11]) ? p[11] : [];
  return {
    name: String(p[1] || ''),
    handle,
    profileUrl: handle
      ? `https://me.developers.google.com/u/${handle}`
      : 'https://me.developers.google.com/communities/experts',
    location: String(loc[3] || ''),
  };
}

// ---------------------------------------------------------------------------
// Signed Allow / Block links
// ---------------------------------------------------------------------------

function normalizeDecisionAction(action) {
  const a = String(action || '').toLowerCase();
  if (a === 'allow' || a === 'approve') return 'approve';
  if (a === 'block') return 'block';
  return '';
}

function signDecision(key, uid, action, exp) {
  const canonicalAction = normalizeDecisionAction(action) || String(action || '');
  return crypto
    .createHmac('sha256', key)
    .update(`${uid}.${canonicalAction}.${exp}`)
    .digest('base64url');
}

function buildDecisionUrl(key, uid, action, now = Date.now()) {
  const canonicalAction = normalizeDecisionAction(action) || 'approve';
  const exp = now + DECISION_LINK_TTL_MS;
  const sig = signDecision(key, uid, canonicalAction, exp);
  return `${APP_BASE_URL}/api/access/decide?uid=${encodeURIComponent(uid)}&action=${canonicalAction}&exp=${exp}&sig=${sig}`;
}

function verifyDecision(key, { uid, action, exp, sig }, now = Date.now()) {
  const canonicalAction = normalizeDecisionAction(action);
  if (!key || !uid || !canonicalAction) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < now) return false;
  const expected = Buffer.from(signDecision(key, String(uid), canonicalAction, expNum));
  const received = Buffer.from(String(sig || ''));
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

function safeHttpsUrl(raw) {
  const value = String(raw || '').trim().slice(0, 300);
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function emailLayout(heading, rowsHtml, actionsHtml) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;color:#202124">
  <h2 style="margin:0 0 12px">${heading}</h2>
  <table style="border-collapse:collapse;margin-bottom:16px">${rowsHtml}</table>
  ${actionsHtml}
</div>`;
}

function row(label, valueHtml) {
  return `<tr><td style="padding:4px 12px 4px 0;color:#5f6368">${label}</td><td style="padding:4px 0">${valueHtml}</td></tr>`;
}

function button(href, label, color) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:10px 18px;margin-right:8px;border-radius:6px;background:${color};color:#fff;text-decoration:none;font-weight:bold">${label}</a>`;
}

function buildAccessRequestEmail({ record, approveUrl, blockUrl }) {
  const name = record.displayName || '(no name)';
  const profileLink = safeHttpsUrl(record.profileLink);
  const rows = [
    row('Name', escapeHtml(name)),
    row('Email', escapeHtml(record.email || '')),
    row(
      'GDE profile',
      profileLink ? `<a href="${escapeHtml(profileLink)}">${escapeHtml(profileLink)}</a>` : 'Not provided',
    ),
    record.lookupFailed ? row('Note', 'The GDE directory could not be reached during the check.') : '',
  ].join('');
  return {
    subject: `GDE Pulse access request: ${name}`,
    text: [
      `${name} (${record.email || 'no email'}) could not be validated against the GDE directory (< 90% match) and is asking for access.`,
      profileLink ? `GDE profile: ${profileLink}` : 'GDE profile: not provided',
      `Allow: ${approveUrl}`,
      `Block: ${blockUrl}`,
      'Links expire in 7 days.',
    ].join('\n'),
    html: emailLayout(
      'Access request',
      rows,
      `${button(approveUrl, 'Allow', '#188038')}${button(blockUrl, 'Block', '#d93025')}
       <p style="color:#5f6368;font-size:12px">Links expire in 7 days.</p>`,
    ),
  };
}

function buildAutoValidatedEmail({ record, blockUrl }) {
  const name = record.displayName || '(no name)';
  const profile = record.matchedProfile || {};
  const pct = record.similarity ? ` (${Math.round(record.similarity * 100)}% match)` : '';
  const rows = [
    row('Name', escapeHtml(name)),
    row('Email', escapeHtml(record.email || '')),
    row(
      'Matched GDE',
      `<a href="${escapeHtml(profile.profileUrl || '')}">${escapeHtml(profile.name || '')}</a>${escapeHtml(pct)}${
        profile.location ? ` · ${escapeHtml(profile.location)}` : ''
      }`,
    ),
  ].join('');
  return {
    subject: `GDE Pulse: ${name} signed in (validated as GDE)`,
    text: [
      `${name} (${record.email || 'no email'}) was validated against the GDE directory${pct} and has access.`,
      `Matched GDE profile: ${profile.name || ''} ${profile.profileUrl || ''}`,
      `Not a GDE? Block: ${blockUrl}`,
    ].join('\n'),
    html: emailLayout(
      'New GDE validated',
      rows,
      `<p style="margin:0 0 12px">Not a GDE?</p>${button(blockUrl, 'Block', '#d93025')}`,
    ),
  };
}

function buildApprovedNoticeEmail({ record }) {
  return {
    subject: 'Your GDE Pulse access was approved',
    text: `Hi ${record.displayName || ''},\n\nYour access to GDE Pulse was approved. Sign in at ${APP_BASE_URL}`,
    html: emailLayout(
      'Access approved',
      row('Name', escapeHtml(record.displayName || '')),
      button(APP_BASE_URL, 'Open GDE Pulse', '#1a73e8'),
    ),
  };
}

let cachedSigningKey = '';
async function resolveSigningKey(ctx) {
  if (process.env.GDE_ACCESS_SIGNING_KEY) return process.env.GDE_ACCESS_SIGNING_KEY;
  if (cachedSigningKey) return cachedSigningKey;
  if (ctx && typeof ctx.getSecret === 'function') {
    try {
      cachedSigningKey = String((await ctx.getSecret('GDE_ACCESS_SIGNING_KEY')) || '').trim();
      return cachedSigningKey;
    } catch {
      return '';
    }
  }
  return '';
}

let cachedSmtpPass = '';
async function resolveSmtpPassword(ctx) {
  if (process.env.GDE_SMTP_APP_PASSWORD) return process.env.GDE_SMTP_APP_PASSWORD;
  if (cachedSmtpPass) return cachedSmtpPass;
  if (ctx && typeof ctx.getSecret === 'function') {
    try {
      cachedSmtpPass = String((await ctx.getSecret('GDE_SMTP_APP_PASSWORD')) || '').trim();
      return cachedSmtpPass;
    } catch {
      return '';
    }
  }
  return '';
}

let cachedTransport = null;
async function sendEmail({ to, subject, text, html }, ctx) {
  const pass = await resolveSmtpPassword(ctx);
  if (!pass) throw new Error('GDE_SMTP_APP_PASSWORD is not configured');
  if (!cachedTransport) {
    const nodemailer = require('nodemailer');
    cachedTransport = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass },
    });
  }
  await cachedTransport.sendMail({ from: `"GDE Pulse" <${SMTP_USER}>`, to, subject, text, html });
}

// ---------------------------------------------------------------------------
// Firestore helpers
// ---------------------------------------------------------------------------

function isAllowedStatus(status) {
  return ALLOWED_STATUSES.has(String(status || ''));
}

async function getAccessStatus(db, uid) {
  if (!uid) return null;
  const snap = await db.collection(ACCESS_COLLECTION).doc(uid).get();
  return snap.exists ? String(snap.data()?.status || '') : null;
}

async function hasGdeAccess(db, uid) {
  return isAllowedStatus(await getAccessStatus(db, uid));
}

/** Verifies the X-Firebase-Id-Token header and rejects anonymous (quiz participant) sessions. */
async function verifyGoogleUser(req, admin) {
  const idToken = String(req.headers['x-firebase-id-token'] || '').trim();
  if (!idToken) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!decoded?.uid || decoded.firebase?.sign_in_provider === 'anonymous') return null;
    return decoded;
  } catch {
    return null;
  }
}

function isAdminUser(decoded) {
  const email = String(decoded.email || '').toLowerCase();
  return Boolean(decoded.email_verified) && ADMIN_EMAILS.includes(email);
}

// ---------------------------------------------------------------------------
// Route handlers: /api/access/check, /api/access/request, /api/access/decide
// ---------------------------------------------------------------------------

async function handleCheck(decoded, body, ctx) {
  const { db, admin, fetchExperts } = ctx;
  const uid = decoded.uid;
  const ref = db.collection(ACCESS_COLLECTION).doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data() : null;
  const now = admin.firestore.FieldValue.serverTimestamp();

  const userSnap = await db.collection('gde_users').doc(uid).get();
  const userData = userSnap.exists ? userSnap.data() : null;

  const candidateEmail = String(decoded.email || userData?.email || body?.email || '').trim();
  const candidateName = String(decoded.name || userData?.displayName || body?.displayName || '').trim();

  const base = {
    uid,
    email: candidateEmail,
    displayName: candidateName,
    lastCheckedAt: now,
  };

  if (isAdminUser(decoded)) {
    if (existing?.status !== 'approved') {
      await ref.set({ ...base, status: 'approved', method: 'admin', decidedAt: now }, { merge: true });
    }
    return { status: 'approved' };
  }

  if (existing && ['approved', 'validated', 'blocked'].includes(existing.status)) {
    return { status: existing.status };
  }

  if (!existing) {
    const createdMs = userSnap.exists && userSnap.createTime ? userSnap.createTime.toMillis() : NaN;
    if (Number.isFinite(createdMs) && createdMs < GRANDFATHER_CUTOFF_MS) {
      await ref.set({ ...base, status: 'approved', method: 'grandfathered', decidedAt: now });
      return { status: 'approved' };
    }
  }

  let match = null;
  let lookupFailed = false;
  try {
    match = matchGdeByName(await fetchExperts(), candidateName, candidateEmail);
  } catch (err) {
    lookupFailed = true;
    console.error('[GDE Access] Directory lookup failed:', err?.message || err);
  }

  if (match) {
    const record = {
      ...base,
      status: 'validated',
      method: `directory-${match.matchedOn}`,
      similarity: match.similarity,
      matchedProfile: match.profile,
      decidedAt: now,
    };
    await ref.set(record, { merge: true });
    const key = await resolveSigningKey(ctx);
    if (key) {
      const mail = buildAutoValidatedEmail({ record, blockUrl: buildDecisionUrl(key, uid, 'block') });
      await sendEmail({ to: ADMIN_NOTIFY_EMAIL, ...mail }, ctx).catch((err) =>
        console.error('[GDE Access] FYI email failed:', err?.message || err),
      );
    }
    return { status: 'validated', similarity: match.similarity };
  }

  if (existing?.status === 'pending') {
    await ref.set({ lastCheckedAt: now }, { merge: true });
    return { status: 'pending' };
  }
  await ref.set({ ...base, status: 'unverified', lookupFailed }, { merge: true });
  return { status: 'unverified' };
}

async function handleRequest(decoded, body, ctx) {
  const { db, admin } = ctx;
  const uid = decoded.uid;
  const ref = db.collection(ACCESS_COLLECTION).doc(uid);
  const snap = await ref.get();
  const existing = snap.exists ? snap.data() : null;

  if (!existing) return { httpStatus: 409, body: { ok: false, error: 'Run the access check first.' } };
  if (existing.status === 'blocked') return { httpStatus: 403, body: { ok: false, status: 'blocked' } };
  if (isAllowedStatus(existing.status)) return { httpStatus: 200, body: { ok: true, status: existing.status } };

  const lastRequestedMs = existing.requestedAt?.toMillis ? existing.requestedAt.toMillis() : 0;
  if (existing.status === 'pending' && Date.now() - lastRequestedMs < REQUEST_COOLDOWN_MS) {
    return { httpStatus: 200, body: { ok: true, status: 'pending', alreadyRequested: true } };
  }

  const key = await resolveSigningKey(ctx);
  if (!key) {
    console.error('[GDE Access] GDE_ACCESS_SIGNING_KEY is not configured');
    return { httpStatus: 503, body: { ok: false, error: 'Access requests are not available right now.' } };
  }

  const record = {
    ...existing,
    email: String(decoded.email || existing.email || ''),
    displayName: String(decoded.name || existing.displayName || ''),
    profileLink: safeHttpsUrl(body?.profileLink),
  };
  const approveUrl = buildDecisionUrl(key, uid, 'approve');
  const blockUrl = buildDecisionUrl(key, uid, 'block');
  const mail = buildAccessRequestEmail({
    record,
    approveUrl,
    blockUrl,
  });

  let emailDelivered = false;
  try {
    await sendEmail({ to: ADMIN_NOTIFY_EMAIL, ...mail }, ctx);
    emailDelivered = true;
  } catch (err) {
    console.error('[GDE Access] Request email warning:', err?.message || err);
  }

  const nowTs = admin.firestore.FieldValue.serverTimestamp();
  // Store admin-only request audit with signed Allow / Block URLs in gde_access_requests/{uid}
  await db
    .collection(ACCESS_REQUESTS_COLLECTION)
    .doc(uid)
    .set(
      {
        uid,
        email: record.email,
        displayName: record.displayName,
        profileLink: record.profileLink,
        approveUrl,
        blockUrl,
        emailDelivered,
        requestedAt: nowTs,
      },
      { merge: true },
    );

  await ref.set(
    {
      status: 'pending',
      email: record.email,
      displayName: record.displayName,
      profileLink: record.profileLink,
      requestedAt: nowTs,
    },
    { merge: true },
  );
  return { httpStatus: 200, body: { ok: true, status: 'pending', emailDelivered } };
}

function renderPage(title, message, extraHtml = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title></head>
<body style="font-family:Arial,sans-serif;background:#f8f9fa;color:#202124;display:flex;justify-content:center;padding:48px 16px">
<main style="background:#fff;border:1px solid #dadce0;border-radius:12px;padding:28px;max-width:440px;width:100%">
<h1 style="font-size:22px;margin:0 0 8px">${escapeHtml(title)}</h1>
<p style="margin:0 0 20px;color:#5f6368">${message}</p>${extraHtml}
</main></body></html>`;
}

async function handleDecide(req, res, ctx) {
  const { db, admin } = ctx;
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'text/html; charset=utf-8');
  const params = req.method === 'POST' ? req.body || {} : req.query || {};
  const canonicalAction = normalizeDecisionAction(params.action);
  const decision = {
    uid: String(params.uid || ''),
    action: canonicalAction,
    exp: String(params.exp || ''),
    sig: String(params.sig || ''),
  };

  const key = await resolveSigningKey(ctx);
  if (!verifyDecision(key, decision)) {
    res.status(403).send(renderPage('Link expired or invalid', 'Ask the user to request access again.'));
    return;
  }

  const ref = db.collection(ACCESS_COLLECTION).doc(decision.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    res.status(404).send(renderPage('User not found', 'This access request no longer exists.'));
    return;
  }
  const record = snap.data();
  const who = `${escapeHtml(record.displayName || 'This user')} (${escapeHtml(record.email || 'no email')})`;
  const isApprove = decision.action === 'approve';

  // GET only shows a confirmation page, so email link scanners can't trigger the decision.
  if (req.method !== 'POST') {
    const hidden = ['uid', 'action', 'exp', 'sig']
      .map((k) => `<input type="hidden" name="${k}" value="${escapeHtml(decision[k])}">`)
      .join('');
    const color = isApprove ? '#188038' : '#d93025';
    res.status(200).send(
      renderPage(
        isApprove ? 'Allow access?' : 'Block access?',
        `${who} · current status: ${escapeHtml(record.status || 'unknown')}`,
        `<form method="post" action="/api/access/decide">${hidden}
<button type="submit" style="padding:10px 18px;border:0;border-radius:6px;background:${color};color:#fff;font-weight:bold;cursor:pointer">${isApprove ? 'Allow' : 'Block'}</button></form>`,
      ),
    );
    return;
  }

  const nextStatus = isApprove ? 'approved' : 'blocked';
  await ref.set(
    { status: nextStatus, method: 'admin-email', decidedAt: admin.firestore.FieldValue.serverTimestamp() },
    { merge: true },
  );
  if (isApprove && record.email && record.status !== 'approved') {
    await sendEmail({ to: record.email, ...buildApprovedNoticeEmail({ record }) }, ctx).catch((err) =>
      console.error('[GDE Access] Approval notice failed:', err?.message || err),
    );
  }
  res
    .status(200)
    .send(renderPage(isApprove ? 'Access allowed' : 'Access blocked', `${who} is now ${nextStatus}.`));
}

async function handleAccessRoute(req, res, ctx) {
  const sub = req.path.replace(/^\/api\/access\/?/, '');
  try {
    if (sub === 'decide') {
      await handleDecide(req, res, ctx);
      return;
    }
    if (req.method !== 'POST' || (sub !== 'check' && sub !== 'request')) {
      res.status(404).json({ ok: false, error: 'Not found.' });
      return;
    }
    const decoded = await verifyGoogleUser(req, ctx.admin);
    if (!decoded) {
      res.status(401).json({ ok: false, error: 'Sign in with Google first.' });
      return;
    }
    if (sub === 'check') {
      res.status(200).json({ ok: true, ...(await handleCheck(decoded, req.body || {}, ctx)) });
      return;
    }
    const result = await handleRequest(decoded, req.body, ctx);
    res.status(result.httpStatus).json(result.body);
  } catch (err) {
    console.error('[GDE Access] Error:', err?.message || err);
    res.status(500).json({ ok: false, error: 'Access check failed. Please try again.' });
  }
}

module.exports = {
  ACCESS_COLLECTION,
  MATCH_THRESHOLD,
  SECRET_NAMES,
  buildAccessRequestEmail,
  buildAutoValidatedEmail,
  buildDecisionUrl,
  handleAccessRoute,
  hasGdeAccess,
  isAllowedStatus,
  matchGdeByName,
  nameTokens,
  stringSimilarity,
  verifyDecision,
  verifyGoogleUser,
};
