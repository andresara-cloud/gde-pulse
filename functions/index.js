const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const gdeAccess = require('./gdeAccess');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const ADVOCU_BASE = 'https://api.advocu.com/personal-api/v1/gde';
const ADVOCU_COMMUNITY_ID = '6597d5c3b52eaef4e46a602e';
const ADVOCU_TOKEN_URL = 'https://accounts.advocu.com/realms/advocu/protocol/openid-connect/token';
const ADVOCU_REFRESH_SECRET_NAME = 'advocu-refresh-token';
const ADVOCU_OPEN_CFP_SNAPSHOT = require('./advocu_opencfp_snapshot.json');
const GDE_DIRECTORY_RPC_URL =
  'https://me.developers.google.com/_/GoogleDeveloperProfile/data/batchexecute?rpcids=KbHoR';
const GEMINI_MODEL = 'gemini-3.8-flash';
const GCP_PROJECT_ID = process.env.GCLOUD_PROJECT || admin.app().options.projectId || 'andresara';

const EVENT_COLUMN_SCHEMA = {
  id: { type: 'string', mutable: false, required: true, maxLen: 128, description: 'Immutable primary key' },
  title: { type: 'string', mutable: true, required: true, maxLen: 300, description: 'Event Name' },
  sessionTitle: { type: 'string', mutable: true, maxLen: 500, description: 'Talk / Session Name' },
  startDate: { type: 'string', mutable: true, required: true, maxLen: 64, description: 'Event Start Date (YYYY-MM-DD)' },
  endDate: { type: 'string', mutable: true, required: true, maxLen: 64, description: 'Event End Date (YYYY-MM-DD)' },
  city: { type: 'string', mutable: true, maxLen: 150, description: 'Event City' },
  country: { type: 'string', mutable: true, required: true, maxLen: 100, description: 'Destination Country' },
  region: {
    type: 'string',
    mutable: true,
    required: true,
    enumValues: ['Europe', 'MENAT', 'SSA', 'NA', 'LATAM', 'APAC'],
    description: 'GDE Region',
  },
  status: {
    type: 'string',
    mutable: true,
    required: true,
    enumValues: ['Considering', 'Applied', 'Confirmed', 'Completed', 'Declined'],
    description: 'Lifecycle Status',
  },
  budgetUsd: {
    type: 'number',
    mutable: true,
    enumValues: [0, 600, 800, 1200],
    description: 'Travel Budget Tier in USD (0, 600, 800, 1200)',
  },
  eventApplied: { type: 'boolean', mutable: true, description: 'Whether CFP / Event was applied for' },
  eventApproved: { type: 'boolean', mutable: true, description: 'Whether accepted/approved by organizers' },
  worktripsRequested: { type: 'boolean', mutable: true, description: 'Whether WorkTrips request was submitted' },
  worktripsApproved: { type: 'boolean', mutable: true, description: 'Whether WorkTrips request was approved' },
  worktripsTravelRequested: { type: 'boolean', mutable: true, description: 'Legacy WorkTrips travel requested flag' },
  worktripsTravelApproved: { type: 'boolean', mutable: true, description: 'Legacy WorkTrips travel approved flag' },
  campaign: {
    type: 'string',
    mutable: true,
    enumValues: ['I/O Extended', 'Build with AI', 'DevFest', 'Cloud Next', 'Community / Other'],
    description: 'Event Campaign Type',
  },
  activityType: {
    type: 'string',
    mutable: true,
    enumValues: ['Talk', 'Workshop', 'Panel', 'Mentoring'],
    description: 'Activity Type',
  },
  eventFormat: {
    type: 'string',
    mutable: true,
    enumValues: ['In-Person', 'Hybrid', 'Virtual'],
    description: 'Event Format',
  },
  expectedAudience: { type: 'number', mutable: true, description: 'Expected Audience Size' },
  isGdgOnCampus: { type: 'boolean', mutable: true, description: 'Whether event is GDG on Campus' },
  budgetApproved: { type: 'boolean', mutable: true, description: 'Whether budget is approved' },
  bookingMode: { type: 'string', mutable: true, maxLen: 100, description: 'Booking Mode' },
  travelApprovalStatus: {
    type: 'string',
    mutable: true,
    enumValues: ['Not Submitted', 'Pending', 'Approved', 'Rejected'],
    description: 'Travel Approval Status',
  },
  flightBooked: { type: 'boolean', mutable: true, description: 'Whether flights are booked' },
  hotelBooked: { type: 'boolean', mutable: true, description: 'Whether hotel is booked' },
  worktripsRef: { type: 'string', mutable: true, maxLen: 200, description: 'WorkTrips Reference ID' },
  reimbursementSubmitted: { type: 'boolean', mutable: true, description: 'Whether reimbursement was submitted' },
  reimbursementSubmittedDate: { type: 'string', mutable: true, maxLen: 64, description: 'Reimbursement Submission Date' },
  reimbursementAmountUsd: { type: 'number', mutable: true, description: 'Reimbursement Amount USD' },
  advocuSynced: { type: 'boolean', mutable: true, description: 'Whether synced with Advocu' },
  cfpPlatform: { type: 'string', mutable: true, maxLen: 100, description: 'CFP Platform' },
  cfpUrl: { type: 'string', mutable: true, maxLen: 2048, description: 'CFP URL' },
  eventUrl: { type: 'string', mutable: true, maxLen: 2048, description: 'Event URL' },
  departureCountry: { type: 'string', mutable: true, maxLen: 100, description: 'Departure Country' },
  departureRegion: { type: 'string', mutable: true, maxLen: 100, description: 'Departure Region' },
  notes: { type: 'string', mutable: true, maxLen: 5000, description: 'Speaker Notes' },
  updatedAt: { type: 'string', mutable: false, maxLen: 64, description: 'Last Modified Timestamp (auto-managed)' },
};

const ALLOWED_EVENT_COLUMNS = Object.keys(EVENT_COLUMN_SCHEMA);

function validateEventPatchServer(patch, isCreate = false) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new Error('Schema Lock Error: Payload must be a JSON object.');
  }
  const keys = Object.keys(patch);
  if (keys.length === 0) {
    throw new Error('Schema Lock Error: At least one valid field must be provided.');
  }
  const validated = {};
  for (const key of keys) {
    const spec = EVENT_COLUMN_SCHEMA[key];
    if (!spec) {
      throw new Error(
        `Schema Lock Error: Unknown field '${key}'. Schema changes and extra fields are forbidden.`,
      );
    }
    if (!spec.mutable && !isCreate) {
      throw new Error(`Schema Lock Error: Field '${key}' is immutable and cannot be modified.`);
    }
    const val = patch[key];
    if (spec.type === 'string') {
      if (typeof val !== 'string') {
        throw new Error(`Schema Type Error: Field '${key}' expects string, got ${typeof val}.`);
      }
      if (spec.required && val.trim().length === 0) {
        throw new Error(`Schema Type Error: Required field '${key}' cannot be empty.`);
      }
      if (spec.maxLen && val.length > spec.maxLen) {
        throw new Error(`Schema Type Error: Field '${key}' exceeds max length of ${spec.maxLen}.`);
      }
    } else if (spec.type === 'number') {
      if (typeof val !== 'number' || !Number.isFinite(val) || val < 0) {
        throw new Error(`Schema Type Error: Field '${key}' expects a non-negative number.`);
      }
    } else if (spec.type === 'boolean') {
      if (typeof val !== 'boolean') {
        throw new Error(`Schema Type Error: Field '${key}' expects boolean, got ${typeof val}.`);
      }
    }
    if (spec.enumValues && !spec.enumValues.includes(val)) {
      throw new Error(
        `Schema Enum Error: Invalid value ${JSON.stringify(val)} for '${key}'. Allowed: ${spec.enumValues.join(', ')}.`,
      );
    }
    validated[key] = val;
  }
  if (!('status' in validated)) {
    if (validated.eventApproved === true) validated.status = 'Confirmed';
    else if (validated.eventApplied === true && validated.eventApproved === false) validated.status = 'Applied';
  }
  if ('worktripsApproved' in validated) {
    validated.budgetApproved = Boolean(validated.worktripsApproved);
    if (validated.worktripsApproved === true) validated.travelApprovalStatus = 'Approved';
  }
  return validated;
}

function parseSqlLiteralServer(raw) {
  const s = String(raw || '').trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (/^true$/i.test(s)) return true;
  if (/^false$/i.test(s)) return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  throw new Error(`SQL Syntax Error: Invalid literal ${s}. Wrap strings in single quotes.`);
}

function splitTopLevelServer(input, delimiter) {
  const result = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      current += ch;
    } else if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
    } else if (!inSingle && !inDouble && input.slice(i, i + delimiter.length).toUpperCase() === delimiter.toUpperCase()) {
      result.push(current.trim());
      current = '';
      i += delimiter.length - 1;
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function evaluateWhereServer(row, whereSql) {
  if (!whereSql || !whereSql.trim()) return true;
  const orGroups = splitTopLevelServer(whereSql, ' OR ');
  return orGroups.some((orPart) => {
    const andClauses = splitTopLevelServer(orPart, ' AND ');
    return andClauses.every((clause) => {
      const m = clause.match(/^([a-zA-Z0-9_]+)\s*(=|!=|<>|>=|<=|>|<|LIKE|ILIKE)\s*(.+)$/i);
      if (!m) throw new Error(`SQL Syntax Error: Invalid WHERE condition '${clause}'.`);
      const [, col, opRaw, valRaw] = m;
      if (!EVENT_COLUMN_SCHEMA[col]) {
        throw new Error(`Schema Lock Error: Unknown column '${col}' in WHERE clause.`);
      }
      const expected = parseSqlLiteralServer(valRaw);
      const actual = row[col];
      const op = opRaw.toUpperCase();
      if (op === 'LIKE' || op === 'ILIKE') {
        const pattern = String(expected)
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/%/g, '.*')
          .replace(/_/g, '.');
        return new RegExp(`^${pattern}$`, 'i').test(String(actual ?? ''));
      }
      if (op === '=') return actual === expected;
      if (op === '!=' || op === '<>') return actual !== expected;
      if (op === '>') return Number(actual ?? 0) > Number(expected) || String(actual ?? '') > String(expected);
      if (op === '<') return Number(actual ?? 0) < Number(expected) || String(actual ?? '') < String(expected);
      if (op === '>=') return Number(actual ?? 0) >= Number(expected) || String(actual ?? '') >= String(expected);
      if (op === '<=') return Number(actual ?? 0) <= Number(expected) || String(actual ?? '') <= String(expected);
      return false;
    });
  });
}

function executeLockedSqlServer(sqlRaw, currentEvents) {
  const cleaned = String(sqlRaw || '')
    .replace(/--.*$/gm, '')
    .trim()
    .replace(/;+\s*$/, '')
    .trim();
  if (!cleaned) throw new Error('SQL Error: Empty SQL query.');
  if (splitTopLevelServer(cleaned, ';').length > 1) {
    throw new Error('Security Error: Multiple SQL statements in a single request are forbidden.');
  }
  const firstWord = (cleaned.split(/\s+/)[0] || '').toUpperCase();
  const forbiddenDdl = new Set(['ALTER', 'DROP', 'CREATE', 'TRUNCATE', 'RENAME', 'GRANT', 'REVOKE', 'PRAGMA', 'ATTACH', 'DETACH']);
  if (forbiddenDdl.has(firstWord)) {
    throw new Error(
      `Schema Lock Error: '${firstWord}' statements are strictly forbidden. Schema changes and extra columns are locked.`,
    );
  }
  if (/^(DESCRIBE|DESC)\s+events$/i.test(cleaned) || /^SHOW\s+COLUMNS\s+FROM\s+events$/i.test(cleaned)) {
    const rows = Object.entries(EVENT_COLUMN_SCHEMA).map(([column, spec]) => ({
      column,
      type: spec.type,
      mutable: spec.mutable,
      required: Boolean(spec.required),
      allowedValues: spec.enumValues ? spec.enumValues.join(' | ') : '*',
      description: spec.description,
    }));
    return { command: 'DESCRIBE', affectedCount: rows.length, rows, upsertedEvents: [], deletedEventIds: [] };
  }
  if (firstWord === 'SELECT') {
    const m = cleaned.match(
      /^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i,
    );
    if (!m) throw new Error('SQL Syntax Error: Expected SELECT <columns> FROM events [WHERE ...] [ORDER BY ...] [LIMIT n].');
    const [, colsRaw, tableName, whereClause, orderCol, orderDir, limitRaw] = m;
    if (tableName.toLowerCase() !== 'events') {
      throw new Error(`Schema Lock Error: Unknown table '${tableName}'. Only 'events' exists.`);
    }
    const selectedCols = colsRaw.trim() === '*'
      ? ALLOWED_EVENT_COLUMNS
      : colsRaw.split(',').map((c) => c.trim()).filter(Boolean);
    for (const col of selectedCols) {
      if (!EVENT_COLUMN_SCHEMA[col]) throw new Error(`Schema Lock Error: Unknown column '${col}' in SELECT.`);
    }
    if (orderCol && !EVENT_COLUMN_SCHEMA[orderCol]) {
      throw new Error(`Schema Lock Error: Unknown column '${orderCol}' in ORDER BY.`);
    }
    let matched = currentEvents.filter((ev) => evaluateWhereServer(ev, whereClause || ''));
    if (orderCol) {
      const dir = (orderDir || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;
      matched = [...matched].sort((a, b) => {
        const va = a[orderCol] ?? '';
        const vb = b[orderCol] ?? '';
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb)) * dir;
      });
    }
    if (limitRaw) matched = matched.slice(0, Number(limitRaw));
    const rows = matched.map((ev) => {
      const obj = {};
      for (const col of selectedCols) obj[col] = ev[col] ?? null;
      return obj;
    });
    return { command: 'SELECT', affectedCount: rows.length, rows, upsertedEvents: [], deletedEventIds: [] };
  }
  if (firstWord === 'UPDATE') {
    const m = cleaned.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!m) throw new Error('SQL Syntax Error: Expected UPDATE events SET col = val WHERE ...');
    const [, tableName, setClause, whereClause] = m;
    if (tableName.toLowerCase() !== 'events') throw new Error(`Schema Lock Error: Unknown table '${tableName}'.`);
    if (!whereClause || !whereClause.trim()) {
      throw new Error('Safety Error: UPDATE events requires a WHERE clause.');
    }
    const rawPatch = {};
    for (const assign of splitTopLevelServer(setClause, ',')) {
      const eqIdx = assign.indexOf('=');
      if (eqIdx === -1) throw new Error(`SQL Syntax Error: Invalid SET assignment '${assign}'.`);
      rawPatch[assign.slice(0, eqIdx).trim()] = parseSqlLiteralServer(assign.slice(eqIdx + 1).trim());
    }
    const validatedPatch = validateEventPatchServer(rawPatch, false);
    const nowIso = new Date().toISOString();
    const upsertedEvents = [];
    for (const ev of currentEvents) {
      if (evaluateWhereServer(ev, whereClause)) {
        upsertedEvents.push({ ...ev, ...validatedPatch, updatedAt: nowIso });
      }
    }
    return { command: 'UPDATE', affectedCount: upsertedEvents.length, rows: upsertedEvents, upsertedEvents, deletedEventIds: [] };
  }
  if (firstWord === 'INSERT') {
    const m = cleaned.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+)\)$/i);
    if (!m) throw new Error('SQL Syntax Error: Expected INSERT INTO events (...) VALUES (...).');
    const [, tableName, colsPart, valsPart] = m;
    if (tableName.toLowerCase() !== 'events') throw new Error(`Schema Lock Error: Unknown table '${tableName}'.`);
    const cols = colsPart.split(',').map((c) => c.trim()).filter(Boolean);
    const vals = splitTopLevelServer(valsPart, ',').map((v) => parseSqlLiteralServer(v));
    if (cols.length !== vals.length) throw new Error('SQL Syntax Error: Column count mismatch.');
    const rawObj = {};
    for (let i = 0; i < cols.length; i++) rawObj[cols[i]] = vals[i];
    const validated = validateEventPatchServer(rawObj, true);
    if (!validated.title || !validated.country || !validated.startDate) {
      throw new Error('Schema Lock Error: INSERT requires title, country, and startDate.');
    }
    const nowIso = new Date().toISOString();
    const newEvent = {
      id: String(validated.id || `sql-${Date.now()}`),
      title: String(validated.title),
      sessionTitle: String(validated.sessionTitle || ''),
      campaign: validated.campaign || 'DevFest',
      city: String(validated.city || ''),
      country: String(validated.country),
      region: validated.region || 'Europe',
      startDate: String(validated.startDate),
      endDate: String(validated.endDate || validated.startDate),
      status: validated.status || (validated.eventApproved ? 'Confirmed' : 'Applied'),
      cfpPlatform: validated.cfpPlatform || 'Direct / Other',
      cfpUrl: String(validated.cfpUrl || ''),
      eventUrl: String(validated.eventUrl || ''),
      activityType: validated.activityType || 'Talk',
      eventFormat: validated.eventFormat || 'In-Person',
      expectedAudience: Number(validated.expectedAudience ?? 200),
      isGdgOnCampus: Boolean(validated.isGdgOnCampus ?? false),
      budgetUsd: Number(validated.budgetUsd ?? 800),
      eventApplied: Boolean(validated.eventApplied ?? true),
      eventApproved: Boolean(validated.eventApproved ?? false),
      worktripsRequested: Boolean(validated.worktripsRequested ?? false),
      worktripsApproved: Boolean(validated.worktripsApproved ?? false),
      worktripsTravelRequested: Boolean(validated.worktripsTravelRequested ?? false),
      worktripsTravelApproved: Boolean(validated.worktripsTravelApproved ?? false),
      budgetApproved: Boolean(validated.worktripsApproved ?? false),
      bookingMode: 'WorkTrips Direct',
      travelApprovalStatus: validated.worktripsApproved ? 'Approved' : 'Not Submitted',
      flightBooked: Boolean(validated.flightBooked ?? false),
      hotelBooked: Boolean(validated.hotelBooked ?? false),
      worktripsRef: String(validated.worktripsRef || ''),
      reimbursementSubmitted: Boolean(validated.reimbursementSubmitted ?? false),
      reimbursementSubmittedDate: String(validated.reimbursementSubmittedDate || ''),
      reimbursementAmountUsd: Number(validated.reimbursementAmountUsd ?? 0),
      advocuSynced: Boolean(validated.advocuSynced ?? false),
      photos: [],
      notes: String(validated.notes || ''),
      updatedAt: nowIso,
    };
    return { command: 'INSERT', affectedCount: 1, rows: [newEvent], upsertedEvents: [newEvent], deletedEventIds: [] };
  }
  if (firstWord === 'DELETE') {
    const m = cleaned.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!m) throw new Error('SQL Syntax Error: Expected DELETE FROM events WHERE ...');
    const [, tableName, whereClause] = m;
    if (tableName.toLowerCase() !== 'events') throw new Error(`Schema Lock Error: Unknown table '${tableName}'.`);
    if (!whereClause || !whereClause.trim()) throw new Error('Safety Error: DELETE requires a WHERE clause.');
    const deletedEventIds = [];
    const rows = [];
    for (const ev of currentEvents) {
      if (evaluateWhereServer(ev, whereClause)) {
        deletedEventIds.push(ev.id);
        rows.push({ id: ev.id, title: ev.title, startDate: ev.startDate });
      }
    }
    return { command: 'DELETE', affectedCount: deletedEventIds.length, rows, upsertedEvents: [], deletedEventIds };
  }
  throw new Error(`Unsupported SQL command '${firstWord}'. Allowed: SELECT, UPDATE, INSERT, DELETE, DESCRIBE.`);
}

async function authenticateUserToken(token) {
  if (!token) return null;
  // 1. Personal Agent Token: gde_pat_<uid>_<randomHex>
  if (token.startsWith('gde_pat_')) {
    const parts = token.split('_');
    if (parts.length < 4) return null;
    const hexPart = parts[parts.length - 1];
    const uid = parts.slice(2, -1).join('_');
    if (!uid || !hexPart) return null;
    const userSnap = await db.collection('gde_users').doc(uid).get();
    if (!userSnap.exists) return null;
    const expectedHash = String(userSnap.data()?.agentTokenHash || '');
    if (!expectedHash || expectedHash.length !== 64) return null;
    const actualHash = crypto.createHash('sha256').update(token).digest('hex');
    const bufA = Buffer.from(expectedHash, 'hex');
    const bufB = Buffer.from(actualHash, 'hex');
    if (bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB)) {
      return uid;
    }
    return null;
  }
  // 2. Firebase Auth ID Token (JWT)
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid || null;
  } catch {
    return null;
  }
}

const BADGE_MAP = {
  ml: { label: 'AI / Machine Learning', category: 'AI' },
  'ai-jax': { label: 'AI - JAX', category: 'AI' },
  'ai-keras': { label: 'AI - Keras', category: 'AI' },
  'ai-pytorch': { label: 'AI - PyTorch', category: 'AI' },
  'ai-tpu': { label: 'AI - TPU', category: 'AI' },
  'ai-vllm': { label: 'AI - vLLM', category: 'AI' },
  android: { label: 'Android', category: 'Android' },
  angular: { label: 'Angular', category: 'Angular' },
  'dart-flutter': { label: 'Dart & Flutter', category: 'Flutter' },
  firebase: { label: 'Firebase', category: 'Firebase' },
  go: { label: 'Go', category: 'Go' },
  appsheet: { label: 'Google AppSheet', category: 'Workspace' },
  gcp: { label: 'Google Cloud', category: 'Cloud' },
  'cloud-ai': { label: 'Google Cloud - Cloud AI', category: 'Cloud' },
  'data-cloud': { label: 'Google Cloud - Data Cloud', category: 'Cloud' },
  'cloud-infrastructure': {
    label: 'Google Cloud - Modern & Enterprise Infrastructure',
    category: 'Cloud',
  },
  'cloud-security-operations': {
    label: 'Google Cloud - Security & Operations',
    category: 'Cloud',
  },
  workspace: { label: 'Google Workspace', category: 'Workspace' },
  'web-technologies': { label: 'Web Technologies', category: 'Web' },
};

let cachedExperts = null;
let cachedExpertsAt = 0;
const CACHE_TTL_MS = 15 * 60 * 1000;

async function fetchGdeDirectoryList() {
  if (cachedExperts && Date.now() - cachedExpertsAt < CACHE_TTL_MS) {
    return cachedExperts;
  }
  const reqBody = new URLSearchParams({
    'f.req': JSON.stringify([[['KbHoR', '[]', null, 'generic']]]),
  }).toString();

  const resp = await fetch(GDE_DIRECTORY_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: reqBody,
  });
  if (!resp.ok) {
    throw new Error(`me.developers.google.com HTTP ${resp.status}`);
  }
  const txt = await resp.text();
  const dataLine = txt.split('\n').find((l) => l.startsWith('[["wrb.fr"'));
  if (!dataLine) return [];
  const outer = JSON.parse(dataLine);
  const inner = JSON.parse(outer[0][2]);
  const list = Array.isArray(inner?.[0]) ? inner[0] : [];
  cachedExperts = list;
  cachedExpertsAt = Date.now();
  return list;
}

const EMEA_HUB_SPREADSHEET_ID = '1Bnrl6T_cGhXyXVCrfRhqQkCnuiUeyMbMzuqljzV7zgI';
const SHEETS_SECRET_NAME = 'sheets-service-account-key';
let cachedSheetsToken = '';
let cachedSheetsTokenExp = 0;
let cachedEmeaHubItems = null;
let cachedEmeaHubAt = 0;

const SHEET_MONTHS = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

function parseSheetDate(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[\s\-\/]+([A-Za-z]+)[\s,\-\/]+(\d{4})$/);
  if (dmy) {
    const mm = SHEET_MONTHS[dmy[2].toLowerCase().slice(0, 3)];
    if (mm) return `${dmy[3]}-${mm}-${String(dmy[1]).padStart(2, '0')}`;
  }
  const mdy = s.match(/^([A-Za-z]+)[\s\-\/]+(\d{1,2}),?[\s\-\/]+(\d{4})$/);
  if (mdy) {
    const mm = SHEET_MONTHS[mdy[1].toLowerCase().slice(0, 3)];
    if (mm) return `${mdy[3]}-${mm}-${String(mdy[2]).padStart(2, '0')}`;
  }
  const my = s.match(/^([A-Za-z]+)[\s,\-\/]+(\d{4})$/);
  if (my) {
    const mm = SHEET_MONTHS[my[1].toLowerCase().slice(0, 3)];
    if (mm) return `${my[2]}-${mm}-01`;
  }
  return '';
}

async function getCloudRuntimeAccessToken() {
  try {
    const cred = admin.app().options.credential;
    if (cred && typeof cred.getAccessToken === 'function') {
      const tok = await cred.getAccessToken();
      if (tok?.access_token) return tok.access_token;
    }
  } catch {
    // fallback to metadata server
  }
  const metaResp = await fetch(
    'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
    { headers: { 'Metadata-Flavor': 'Google' } },
  );
  if (metaResp.ok) {
    const metaJson = await metaResp.json();
    return metaJson.access_token || '';
  }
  return '';
}

const MASKED_KEY_SENTINEL = '••••••••';
const ADVOCU_ENC_SECRET_NAME = 'advocu-encryption-key';
const ADVOCU_ENC_KEY_ID = 'k1';
let cachedSheetsSecretRaw = '';
let cachedAdvocuAesKeyBuffer = null;
let cachedLegacyAesKeyBuffer = null;

async function fetchSecretByName(secretName) {
  const cloudToken = await getCloudRuntimeAccessToken();
  if (!cloudToken) {
    throw new Error('Could not obtain GCP runtime access token');
  }
  const secResp = await fetch(
    `https://secretmanager.googleapis.com/v1/projects/${GCP_PROJECT_ID}/secrets/${secretName}/versions/latest:access`,
    { headers: { Authorization: `Bearer ${cloudToken}` } },
  );
  if (!secResp.ok) {
    throw new Error(`Secret Manager HTTP ${secResp.status} for ${secretName}`);
  }
  const secJson = await secResp.json();
  const b64 = secJson?.payload?.data || '';
  return Buffer.from(b64, 'base64').toString('utf8');
}

async function fetchSecretManagerPayload() {
  if (cachedSheetsSecretRaw) return cachedSheetsSecretRaw;
  cachedSheetsSecretRaw = await fetchSecretByName(SHEETS_SECRET_NAME);
  return cachedSheetsSecretRaw;
}

async function getAdvocuAesKey() {
  if (cachedAdvocuAesKeyBuffer) return cachedAdvocuAesKeyBuffer;
  const raw = (await fetchSecretByName(ADVOCU_ENC_SECRET_NAME)).trim();
  cachedAdvocuAesKeyBuffer = crypto.createHash('sha256').update(raw).digest();
  return cachedAdvocuAesKeyBuffer;
}

async function getLegacyAdvocuAesKey() {
  if (cachedLegacyAesKeyBuffer) return cachedLegacyAesKeyBuffer;
  const secretRaw = await fetchSecretManagerPayload();
  cachedLegacyAesKeyBuffer = crypto
    .createHash('sha256')
    .update(secretRaw)
    .update(':gde-planner-advocu-aes256-v1')
    .digest();
  return cachedLegacyAesKeyBuffer;
}

async function encryptAdvocuKey(plaintext) {
  const key = await getAdvocuAesKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v2:${ADVOCU_ENC_KEY_ID}:${iv.toString('base64url')}:${tag.toString('base64url')}:${enc.toString('base64url')}`;
}

async function decryptAdvocuKey(payload) {
  const s = String(payload || '').trim();
  const parts = s.split(':');
  if (parts[0] === 'enc' && parts[1] === 'v2' && parts.length === 6) {
    const [, , , ivB64, tagB64, dataB64] = parts;
    const key = await getAdvocuAesKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]);
    return dec.toString('utf8');
  }
  if (parts[0] === 'enc' && parts[1] === 'v1' && parts.length === 5) {
    const [, , ivB64, tagB64, dataB64] = parts;
    const key = await getLegacyAdvocuAesKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
    const dec = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64url')),
      decipher.final(),
    ]);
    return dec.toString('utf8');
  }
  throw new Error('Unrecognized encrypted key format');
}

function isMaskedSentinel(val) {
  const s = String(val || '').trim();
  return s === MASKED_KEY_SENTINEL || /^[•*]+$/.test(s);
}

async function saveEncryptedAdvocuKeyForUid(uid, rawKey) {
  const db = admin.firestore();
  const userRef = db.collection('gde_users').doc(uid);
  const secretRef = userRef.collection('secrets').doc('advocu');
  const clean = String(rawKey || '').trim();
  const nowIso = new Date().toISOString();

  if (!clean) {
    await secretRef.delete();
    await userRef.set({ advocuApiKey: '', updatedAt: nowIso }, { merge: true });
    return { hasKey: false, maskedKey: '' };
  }

  if (isMaskedSentinel(clean)) {
    const secSnap = await secretRef.get();
    if (secSnap.exists && secSnap.data()?.ciphertext) {
      return { hasKey: true, maskedKey: MASKED_KEY_SENTINEL };
    }
    return { hasKey: false, maskedKey: '' };
  }

  const ciphertext = await encryptAdvocuKey(clean);
  await secretRef.set({
    ciphertext,
    keyId: ADVOCU_ENC_KEY_ID,
    algorithm: 'AES-256-GCM',
    updatedAt: nowIso,
  });
  await userRef.set({ advocuApiKey: MASKED_KEY_SENTINEL, updatedAt: nowIso }, { merge: true });
  return { hasKey: true, maskedKey: MASKED_KEY_SENTINEL };
}

async function resolveAdvocuKeyForUid(uid) {
  const db = admin.firestore();
  const userRef = db.collection('gde_users').doc(uid);
  const secretRef = userRef.collection('secrets').doc('advocu');
  const secSnap = await secretRef.get();
  if (secSnap.exists && secSnap.data()?.ciphertext) {
    const rawCipher = String(secSnap.data().ciphertext || '');
    try {
      const decrypted = await decryptAdvocuKey(rawCipher);
      if (decrypted && rawCipher.startsWith('enc:v1:')) {
        await saveEncryptedAdvocuKeyForUid(uid, decrypted).catch((err) => {
          console.error(`[Advocu Vault] Re-key upgrade failed for ${uid}:`, err.message);
        });
      }
      return decrypted;
    } catch (err) {
      console.error(`[Advocu Vault] Decrypt failed for UID ${uid}:`, err.message);
      return '';
    }
  }
  return '';
}

async function verifyRequestFirebaseUid(req) {
  const idToken = String(req.headers['x-firebase-id-token'] || '').trim();
  if (!idToken) return '';
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded?.uid || '';
  } catch {
    return '';
  }
}

async function getSheetsAccessToken() {
  const nowSec = Math.floor(Date.now() / 1000);
  if (cachedSheetsToken && cachedSheetsTokenExp > nowSec + 120) {
    return cachedSheetsToken;
  }
  const saRaw = await fetchSecretManagerPayload();
  const sa = JSON.parse(saRaw);

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claim = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  ).toString('base64url');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  const sig = signer.sign(sa.private_key, 'base64url');

  const tokResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claim}.${sig}`,
    }),
  });
  if (!tokResp.ok) {
    throw new Error(`Google OAuth token exchange HTTP ${tokResp.status}`);
  }
  const tokData = await tokResp.json();
  cachedSheetsToken = tokData.access_token || '';
  cachedSheetsTokenExp = nowSec + (Number(tokData.expires_in) || 3500);
  return cachedSheetsToken;
}

function normalizeSheetCountryAndCity(rawRegion, rawCountry, rawCity) {
  let region = String(rawRegion || 'Europe').trim();
  if (!['Europe', 'MENAT', 'SSA', 'NA', 'LATAM', 'APAC', 'India'].includes(region)) {
    region = 'Europe';
  }
  let country = String(rawCountry || '').trim();
  let city = String(rawCity || '').trim();
  if (country.toLowerCase() === 'africa') {
    if (city.toLowerCase() === 'johannesburg' || city.toLowerCase() === 'cape town') {
      country = 'South Africa';
    } else if (city.toLowerCase() === 'kenya') {
      country = 'Kenya';
      city = 'Nairobi';
    } else {
      country = city || 'South Africa';
    }
  } else if (country.toLowerCase() === 'dubai' && city.toLowerCase() === 'uae') {
    country = 'United Arab Emirates';
    city = 'Dubai';
  } else if (country.toLowerCase() === 'uk') {
    country = 'United Kingdom';
  } else if (country.toLowerCase() === 'uae') {
    country = 'United Arab Emirates';
  }
  if (country.toLowerCase() === 'israel') {
    region = 'MENAT';
  } else if (country.toLowerCase() === 'morocco') {
    region = 'MENAT';
  }
  return { region, country, city };
}

let cachedAdvocuKeycloakToken = '';
let cachedAdvocuKeycloakExp = 0;
let lastAdvocuSessionState = {
  active: false,
  error: '',
  lastCheckedAt: '',
};

async function rotateAdvocuRefreshTokenInSecretManager(newToken) {
  const clean = String(newToken || '').trim();
  if (!clean) return false;
  try {
    const cloudToken = await getCloudRuntimeAccessToken();
    if (!cloudToken) return false;
    const parent = `https://secretmanager.googleapis.com/v1/projects/${GCP_PROJECT_ID}/secrets/${ADVOCU_REFRESH_SECRET_NAME}`;
    const addResp = await fetch(`${parent}:addVersion`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cloudToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payload: { data: Buffer.from(clean, 'utf8').toString('base64') },
      }),
    });
    if (!addResp.ok) return false;
    const added = await addResp.json();
    const listResp = await fetch(`${parent}/versions?filter=state:ENABLED`, {
      headers: { Authorization: `Bearer ${cloudToken}` },
    });
    if (listResp.ok) {
      const listData = await listResp.json();
      const versions = Array.isArray(listData?.versions) ? listData.versions : [];
      for (const v of versions) {
        if (v.name && v.name !== added.name) {
          await fetch(`https://secretmanager.googleapis.com/v1/${v.name}:disable`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${cloudToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          }).catch(() => {});
        }
      }
    }
    return true;
  } catch (err) {
    console.warn('[Advocu Session] Secret Manager rotation warning:', err.message);
    return false;
  }
}

async function getAdvocuKeycloakAccessToken(overrideRefreshToken = '') {
  const nowSec = Math.floor(Date.now() / 1000);
  if (
    !overrideRefreshToken &&
    cachedAdvocuKeycloakToken &&
    cachedAdvocuKeycloakExp > nowSec + 60
  ) {
    return cachedAdvocuKeycloakToken;
  }
  try {
    let refreshToken = String(overrideRefreshToken || '').trim();
    if (!refreshToken) {
      try {
        refreshToken = (await fetchSecretByName(ADVOCU_REFRESH_SECRET_NAME)).trim();
      } catch {
        refreshToken = String(process.env.ADVOCU_REFRESH_TOKEN || '').trim();
      }
    }
    if (!refreshToken) {
      lastAdvocuSessionState = {
        active: false,
        error: 'No advocu-refresh-token configured in Secret Manager',
        lastCheckedAt: new Date().toISOString(),
      };
      return '';
    }
    const resp = await fetch(ADVOCU_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: 'advocu-prod',
        refresh_token: refreshToken,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      lastAdvocuSessionState = {
        active: false,
        error: `Keycloak HTTP ${resp.status}: ${errText.slice(0, 180)}`,
        lastCheckedAt: new Date().toISOString(),
      };
      cachedAdvocuKeycloakToken = '';
      cachedAdvocuKeycloakExp = 0;
      return '';
    }
    const data = await resp.json();
    cachedAdvocuKeycloakToken = data.access_token || '';
    cachedAdvocuKeycloakExp = nowSec + (Number(data.expires_in) || 300);
    lastAdvocuSessionState = {
      active: Boolean(cachedAdvocuKeycloakToken),
      error: '',
      lastCheckedAt: new Date().toISOString(),
    };
    const nextRefresh = String(data.refresh_token || overrideRefreshToken || '').trim();
    if (nextRefresh && (overrideRefreshToken || nextRefresh !== refreshToken)) {
      process.env.ADVOCU_REFRESH_TOKEN = nextRefresh;
      await rotateAdvocuRefreshTokenInSecretManager(nextRefresh);
    }
    return cachedAdvocuKeycloakToken;
  } catch (err) {
    lastAdvocuSessionState = {
      active: false,
      error: err.message || String(err),
      lastCheckedAt: new Date().toISOString(),
    };
    return '';
  }
}

function detectAdvocuCampaign(title, tags = []) {
  const combined = `${title || ''} ${(tags || []).join(' ')}`.toLowerCase();
  if (combined.includes('devfest')) return 'DevFest';
  if (combined.includes('build with ai') || combined.includes('bwai')) return 'Build with AI';
  if (combined.includes('i/o extended') || combined.includes('io extended')) return 'I/O Extended';
  return 'GDG';
}

function parseAdvocuEventPayload(ev, fallbackSnap = null) {
  const d =
    ev?.data && typeof ev.data === 'object' ? { ...ev, ...ev.data } : ev || {};
  const id = String(ev?.id || d.id || fallbackSnap?.id || '').trim();
  const cfpArr = Array.isArray(ev?.callForPapers) ? ev.callForPapers : [];
  const cfp = cfpArr[0] || {};
  const cfpId = String(cfp.id || d.cfpId || '').trim();
  const cfpUrl =
    (id && cfpId
      ? `https://app.advocu.com/public/gde/events/${id}?cfpid=${cfpId}`
      : fallbackSnap?.cfpUrl) ||
    (id ? `https://app.advocu.com/events/${id}` : '');

  const rawDesc = String(d.shortDescription || d.description || fallbackSnap?.description || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let externalUrl = String(
    d.bevyEventUrl || d.eventUrl || d.url || fallbackSnap?.externalUrl || '',
  ).trim();
  if (!externalUrl || /advocu\.com/i.test(externalUrl)) {
    const urlMatches = String(d.description || '').match(/https?:\/\/[^\s"'<>)]+/gi) || [];
    const nonAdvocu = urlMatches.find((u) => !/advocu\.com/i.test(u));
    externalUrl = nonAdvocu || '';
  }

  const startDate = String(d.startDateInUtc || '').slice(0, 10) || fallbackSnap?.startDate || '';
  const endDate = String(d.endDateInUtc || '').slice(0, 10) || fallbackSnap?.endDate || startDate;
  const cfpDeadline =
    String(
      cfp.submissionDeadlineInUtc ||
        cfp.endDateInUtc ||
        d.nearestCallForPapersDeadline ||
        '',
    ).slice(0, 10) ||
    fallbackSnap?.cfpDeadline ||
    '';
  const cfpStatus = String(
    cfp.status || d.callForPapersStatus || fallbackSnap?.cfpStatus || 'OPEN',
  ).toUpperCase();
  const tags = Array.isArray(d.tags) && d.tags.length > 0 ? d.tags : fallbackSnap?.tags || [];
  const rawType = String(d.eventType || d.slug || fallbackSnap?.eventFormat || 'In-Person');
  const eventFormat = /online|virtual/i.test(rawType)
    ? 'Virtual'
    : /hybrid/i.test(rawType)
      ? 'Hybrid'
      : 'In-Person';
  const title = String(d.title || fallbackSnap?.title || '').trim();

  return {
    id,
    title,
    city: String(d.city || fallbackSnap?.city || '').trim(),
    country: String(d.country || fallbackSnap?.country || '').trim(),
    startDate,
    endDate,
    cfpDeadline,
    cfpStatus: cfpStatus === 'CLOSED' ? 'CLOSED' : 'OPEN',
    cfpUrl,
    externalUrl,
    eventFormat,
    tags,
    campaign: detectAdvocuCampaign(title, tags),
    chapterTitle: String(
      d.gdgChapterName || d.bevyChapterTitle || fallbackSnap?.chapterTitle || 'Advocu GDE Event',
    ).trim(),
    description: rawDesc.slice(0, 600),
    expectedAudience:
      Number(d.expectedNumberOfAttendees || fallbackSnap?.expectedAudience || 250) || 250,
  };
}

async function fetchAdvocuEventById(eventId) {
  const cleanId = String(eventId || '').trim();
  if (!/^[a-f0-9]{24}$/i.test(cleanId)) return null;
  const snapMatch = Array.isArray(ADVOCU_OPEN_CFP_SNAPSHOT)
    ? ADVOCU_OPEN_CFP_SNAPSHOT.find((item) => item.id === cleanId) || null
    : null;

  try {
    const openResp = await fetch(`https://api.advocu.com/open/events/${cleanId}`, {
      headers: { Accept: 'application/json' },
    });
    if (openResp.ok) {
      const openData = await openResp.json();
      if (openData && openData.data) {
        return parseAdvocuEventPayload(openData, snapMatch);
      }
    }
  } catch {
    // Fallback to Keycloak authenticated endpoint or snapshot
  }

  try {
    const kcToken = await getAdvocuKeycloakAccessToken();
    if (kcToken) {
      const authResp = await fetch(
        `https://api.advocu.com/${ADVOCU_COMMUNITY_ID}/events/${cleanId}`,
        {
          headers: {
            Authorization: `Bearer ${kcToken}`,
            Accept: 'application/json',
          },
        },
      );
      if (authResp.ok) {
        const authData = await authResp.json();
        if (authData && (authData.data || authData.id)) {
          return parseAdvocuEventPayload(authData, snapMatch);
        }
      }
    }
  } catch {
    // Fallback to snapshot
  }

  return snapMatch ? parseAdvocuEventPayload({}, snapMatch) : null;
}

async function fetchLiveAdvocuOpenCfpEvents() {
  const byId = new Map();
  if (Array.isArray(ADVOCU_OPEN_CFP_SNAPSHOT)) {
    for (const item of ADVOCU_OPEN_CFP_SNAPSHOT) {
      if (item && item.id) {
        byId.set(item.id, parseAdvocuEventPayload({}, item));
      }
    }
  }

  const liveDiscoveredIds = [];
  try {
    const kcToken = await getAdvocuKeycloakAccessToken();
    if (kcToken) {
      for (let page = 0; page < 6; page++) {
        const resp = await fetch(
          `https://api.advocu.com/${ADVOCU_COMMUNITY_ID}/events?page=${page}&size=50&tab=open-cfp`,
          {
            headers: {
              Authorization: `Bearer ${kcToken}`,
              Accept: 'application/json',
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
          },
        );
        if (!resp.ok) break;
        const pageData = await resp.json();
        const content = Array.isArray(pageData)
          ? pageData
          : Array.isArray(pageData?.content)
            ? pageData.content
            : [];
        if (content.length === 0) break;
        for (const ev of content) {
          const parsed = parseAdvocuEventPayload(ev, byId.get(ev.id) || null);
          if (parsed.id && parsed.title) {
            byId.set(parsed.id, parsed);
            if (!parsed.externalUrl || !parsed.cfpUrl.includes('cfpid=')) {
              liveDiscoveredIds.push(parsed.id);
            }
          }
        }
        if (pageData?.last || content.length < 50) break;
      }
    }
  } catch {
    // Use snapshot + public open/events enrichment below
  }

  // Enrich any newly discovered live events via public /open/events/{id} to capture bevyEventUrl & cfpid
  const toEnrich = liveDiscoveredIds.slice(0, 25);
  if (toEnrich.length > 0) {
    await Promise.allSettled(
      toEnrich.map(async (id) => {
        const enriched = await fetchAdvocuEventById(id);
        if (enriched && enriched.id) {
          byId.set(enriched.id, enriched);
        }
      }),
    );
  }

  return Array.from(byId.values());
}

async function fetchAdvocuDiscoverEvents(forceRefresh = false) {
  if (!forceRefresh && cachedEmeaHubItems && Date.now() - cachedEmeaHubAt < CACHE_TTL_MS) {
    return {
      items: cachedEmeaHubItems,
      sessionActive: lastAdvocuSessionState.active,
      sessionError: lastAdvocuSessionState.error,
      lastCheckedAt: lastAdvocuSessionState.lastCheckedAt,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const advocuRaw = await fetchLiveAdvocuOpenCfpEvents();
  const advocuCfpMap = new Map();

  for (const item of advocuRaw) {
    if (!item.title || !item.startDate) continue;
    const endDate = item.endDate || item.startDate;
    if (endDate < today) continue;
    if (item.cfpDeadline && item.cfpDeadline < today) continue;
    const isInProgress = item.startDate <= today && endDate >= today;
    const primaryUrl = item.externalUrl || item.cfpUrl;
    const techFocus = (item.tags || [])
      .filter(
        (t) =>
          !/^(conference|networking|community building|workshop \/ hands-on session)$/i.test(t),
      )
      .slice(0, 4)
      .join(', ');

    advocuCfpMap.set(item.id, {
      externalId: `advocu-cfp-${item.id}`,
      title: item.title,
      campaign: item.campaign || 'DevFest',
      source: 'Advocu Open CFP',
      city: item.city,
      country: item.country || 'Online',
      startDate: item.startDate,
      endDate,
      isInProgress,
      url: primaryUrl,
      cfpUrl: item.cfpUrl,
      cfpStatus: isInProgress ? 'CLOSED' : item.cfpStatus || 'OPEN',
      cfpDeadline: item.cfpDeadline || '',
      techFocus,
      description: item.description || '',
      eventFormat: item.eventFormat || 'In-Person',
      expectedAudience: item.expectedAudience || 250,
      isGdgOnCampus: false,
      chapterTitle: item.chapterTitle || 'Advocu Open CFP',
    });
  }

  const advocuCfps = Array.from(advocuCfpMap.values()).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );

  cachedEmeaHubItems = advocuCfps;
  cachedEmeaHubAt = Date.now();
  return {
    items: advocuCfps,
    sessionActive: lastAdvocuSessionState.active,
    sessionError: lastAdvocuSessionState.error,
    lastCheckedAt: lastAdvocuSessionState.lastCheckedAt,
  };
}

function findAndFormatExpert(experts, { name = '', email = '', slug = '' }) {
  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  const targetName = norm(name);
  const targetSlug = norm(slug.replace(/^.*\/u\//i, ''));
  const emailLocal = norm(String(email || '').split('@')[0]);
  const emailDomain = norm(String((email || '').split('@')[1] || '').split('.')[0]);
  const genericDomains = new Set([
    'gmail',
    'google',
    'googlemail',
    'yahoo',
    'outlook',
    'hotmail',
    'icloud',
    'proton',
    'me',
    'live',
  ]);

  let matched = null;
  for (const item of experts) {
    const p = item[0] || [];
    const disp = norm(p[1]);
    const itemSlug = norm(p[17]);
    const gh = norm(p[12]);
    const li = norm(p[14]);
    const tw = norm(p[16]);

    if (
      (targetSlug && (itemSlug === targetSlug || disp === targetSlug)) ||
      (targetName && targetName.length >= 4 && (disp === targetName || itemSlug === targetName)) ||
      (emailLocal &&
        emailLocal.length >= 4 &&
        (itemSlug === emailLocal || disp === emailLocal || gh === emailLocal || tw === emailLocal)) ||
      (emailDomain &&
        emailDomain.length >= 5 &&
        !genericDomains.has(emailDomain) &&
        (itemSlug === emailDomain || disp === emailDomain || li === emailDomain))
    ) {
      matched = item;
      break;
    }
  }

  if (!matched) return null;

  const p = matched[0] || [];
  const rawBadges = Array.isArray(matched[1]) ? matched[1] : [];
  const locArr = Array.isArray(p[11]) ? p[11] : [];
  const countryIso = String(locArr[2] || '');
  const formattedLocation = String(locArr[3] || '');
  const locParts = formattedLocation
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const country = locParts.length > 0 ? locParts[locParts.length - 1] : '';
  const city = locParts.length > 1 ? locParts.slice(0, -1).join(', ') : '';

  const specializations = [];
  const categories = new Set();
  for (const b of rawBadges) {
    const key = String(b).split('/').pop() || '';
    const mapped = BADGE_MAP[key];
    if (mapped) {
      specializations.push(mapped.label);
      categories.add(mapped.category);
    } else if (key) {
      specializations.push(key);
    }
  }

  const profileId = String(p[0] || '');
  const vanitySlug = String(p[17] || '');
  const profileUrl = vanitySlug
    ? `https://me.developers.google.com/u/${vanitySlug}`
    : profileId
      ? `https://me.developers.google.com/u/${profileId.split('/')[1]}`
      : 'https://me.developers.google.com/communities/experts';

  const rawAvatar = String(p[2] || '');
  const avatarUrl = rawAvatar
    ? rawAvatar.includes('=s')
      ? rawAvatar
      : `${rawAvatar}=s240-c`
    : '';

  return {
    profileId,
    directoryName: String(p[1] || ''),
    avatarUrl,
    organization: String(p[8] || ''),
    roleTitle: p[9] && p[9] !== 'DECLINE' && p[9] !== 'DEVELOPER' ? String(p[9]) : '',
    countryIso,
    location: formattedLocation,
    city,
    country,
    github: String(p[12] || ''),
    linkedin: String(p[14] || ''),
    twitter: String(p[16] || ''),
    vanitySlug,
    profileUrl,
    bio: String(p[27] || ''),
    specializations,
    categories: Array.from(categories),
  };
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

exports.advocuProxy = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firebase-Id-Token');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // GDE access control: /api/access/check, /api/access/request, /api/access/decide
  if (req.path.startsWith('/api/access')) {
    await gdeAccess.handleAccessRoute(req, res, {
      db,
      admin,
      fetchExperts: fetchGdeDirectoryList,
      getSecret: fetchSecretByName,
    });
    return;
  }

  // ===============================================================
  // Option 1 & Option 2: Personal Agent API (/api/agent/*) & SQL Connector (/api/sql)
  // Strictly isolated per authenticated UID and locked to EVENT_COLUMN_SCHEMA
  // ===============================================================
  if (req.path.startsWith('/api/sql') || req.path.startsWith('/api/agent')) {
    const authHeader = req.headers.authorization || '';
    const bearerToken =
      authHeader.replace(/^Bearer\s+/i, '').trim() ||
      String(req.body?.token || req.query?.token || '');

    // Public schema introspection endpoint
    if (req.path === '/api/agent/schema' && req.method === 'GET') {
      res.status(200).json({
        ok: true,
        table: 'events',
        schemaLocked: true,
        policy:
          'Only the authenticated user can read or modify their own events. Adding new columns/fields or altering schema is strictly forbidden.',
        columns: EVENT_COLUMN_SCHEMA,
      });
      return;
    }

    const uid = await authenticateUserToken(bearerToken);
    if (!uid) {
      res.status(401).json({
        ok: false,
        error:
          'Unauthorized: Provide a valid Personal Agent Token (Bearer gde_pat_...) or Firebase ID Token.',
      });
      return;
    }
    if (!(await gdeAccess.hasGdeAccess(db, uid))) {
      res.status(403).json({ ok: false, error: 'GDE access has not been approved for this account.' });
      return;
    }

    const eventsCol = db.collection('gde_users').doc(uid).collection('events');

    // Option 2: POST /api/sql — Schema-Locked Virtual SQL Connector over user's Firestore events
    if (req.path.startsWith('/api/sql')) {
      const sql = String(req.body?.sql || req.query?.sql || '');
      try {
        const snap = await eventsCol.get();
        const currentEvents = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const result = executeLockedSqlServer(sql, currentEvents);

        // Persist any validated mutations back to /gde_users/{uid}/events
        if (result.upsertedEvents.length > 0) {
          const batch = db.batch();
          for (const ev of result.upsertedEvents) {
            batch.set(eventsCol.doc(ev.id), ev);
          }
          await batch.commit();
        }
        if (result.deletedEventIds.length > 0) {
          const batch = db.batch();
          for (const delId of result.deletedEventIds) {
            batch.delete(eventsCol.doc(delId));
          }
          await batch.commit();
        }

        res.status(200).json({
          ok: true,
          uid,
          command: result.command,
          affectedCount: result.affectedCount,
          rows: result.rows,
        });
      } catch (err) {
        res.status(400).json({ ok: false, error: err.message || String(err) });
      }
      return;
    }

    // Option 1: /api/agent/events[/:id] — Personal Agent REST API with strict schema lock
    const agentSub = req.path.replace(/^\/api\/agent\/?/, '');
    const parts = agentSub.split('/').filter(Boolean);
    const resource = parts[0] || 'events';
    const targetEventId = parts[1] || '';

    if (resource !== 'events') {
      res.status(404).json({ ok: false, error: `Unknown agent resource '${resource}'. Use /api/agent/events or /api/agent/schema.` });
      return;
    }

    try {
      // GET /api/agent/events or GET /api/agent/events/:id
      if (req.method === 'GET') {
        if (targetEventId) {
          const docSnap = await eventsCol.doc(targetEventId).get();
          if (!docSnap.exists) {
            res.status(404).json({ ok: false, error: `Event '${targetEventId}' not found.` });
            return;
          }
          res.status(200).json({ ok: true, uid, event: { id: docSnap.id, ...docSnap.data() } });
          return;
        }
        const snap = await eventsCol.get();
        let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        for (const [k, v] of Object.entries(req.query || {})) {
          if (k === 'token') continue;
          if (!EVENT_COLUMN_SCHEMA[k]) {
            res.status(400).json({ ok: false, error: `Schema Lock Error: Unknown filter field '${k}'.` });
            return;
          }
          list = list.filter((ev) => String(ev[k]) === String(v));
        }
        list.sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')));
        res.status(200).json({ ok: true, uid, count: list.length, events: list });
        return;
      }

      // PATCH /api/agent/events/:id (or POST with targetEventId) — Modify existing event fields
      if (req.method === 'PATCH' || (req.method === 'POST' && targetEventId)) {
        const idToUpdate = targetEventId || String(req.body?.id || '');
        if (!idToUpdate) {
          res.status(400).json({ ok: false, error: 'Missing event ID in URL (/api/agent/events/:id).' });
          return;
        }
        const existingSnap = await eventsCol.doc(idToUpdate).get();
        if (!existingSnap.exists) {
          res.status(404).json({ ok: false, error: `Event '${idToUpdate}' not found for this user.` });
          return;
        }
        const payload = { ...(req.body || {}) };
        delete payload.token;
        const validatedPatch = validateEventPatchServer(payload, false);
        const updatedEvent = {
          ...existingSnap.data(),
          ...validatedPatch,
          id: idToUpdate,
          updatedAt: new Date().toISOString(),
        };
        await eventsCol.doc(idToUpdate).set(updatedEvent);
        res.status(200).json({ ok: true, uid, updated: updatedEvent });
        return;
      }

      // POST /api/agent/events — Create a new event with strict schema validation
      if (req.method === 'POST' && !targetEventId) {
        const payload = { ...(req.body || {}) };
        delete payload.token;
        const validated = validateEventPatchServer(payload, true);
        if (!validated.title || !validated.country || !validated.startDate) {
          res.status(400).json({
            ok: false,
            error: 'Schema Lock Error: Creating an event requires title, country, and startDate.',
          });
          return;
        }
        const nowIso = new Date().toISOString();
        const newId = String(validated.id || `agent-${Date.now()}`);
        const newEvent = {
          id: newId,
          title: String(validated.title),
          sessionTitle: String(validated.sessionTitle || ''),
          campaign: validated.campaign || 'DevFest',
          city: String(validated.city || ''),
          country: String(validated.country),
          region: validated.region || 'Europe',
          startDate: String(validated.startDate),
          endDate: String(validated.endDate || validated.startDate),
          status: validated.status || (validated.eventApproved ? 'Confirmed' : 'Applied'),
          cfpPlatform: validated.cfpPlatform || 'Direct / Other',
          cfpUrl: String(validated.cfpUrl || ''),
          eventUrl: String(validated.eventUrl || ''),
          activityType: validated.activityType || 'Talk',
          eventFormat: validated.eventFormat || 'In-Person',
          expectedAudience: Number(validated.expectedAudience ?? 200),
          isGdgOnCampus: Boolean(validated.isGdgOnCampus ?? false),
          budgetUsd: Number(validated.budgetUsd ?? 800),
          eventApplied: Boolean(validated.eventApplied ?? true),
          eventApproved: Boolean(validated.eventApproved ?? false),
          worktripsRequested: Boolean(validated.worktripsRequested ?? false),
          worktripsApproved: Boolean(validated.worktripsApproved ?? false),
          worktripsTravelRequested: Boolean(validated.worktripsTravelRequested ?? false),
          worktripsTravelApproved: Boolean(validated.worktripsTravelApproved ?? false),
          budgetApproved: Boolean(validated.worktripsApproved ?? false),
          bookingMode: 'WorkTrips Direct',
          travelApprovalStatus: validated.worktripsApproved ? 'Approved' : 'Not Submitted',
          flightBooked: Boolean(validated.flightBooked ?? false),
          hotelBooked: Boolean(validated.hotelBooked ?? false),
          worktripsRef: String(validated.worktripsRef || ''),
          reimbursementSubmitted: Boolean(validated.reimbursementSubmitted ?? false),
          reimbursementSubmittedDate: String(validated.reimbursementSubmittedDate || ''),
          reimbursementAmountUsd: Number(validated.reimbursementAmountUsd ?? 0),
          advocuSynced: Boolean(validated.advocuSynced ?? false),
          photos: [],
          notes: String(validated.notes || ''),
          updatedAt: nowIso,
        };
        await eventsCol.doc(newId).set(newEvent);
        res.status(201).json({ ok: true, uid, created: newEvent });
        return;
      }

      // DELETE /api/agent/events/:id
      if (req.method === 'DELETE' && targetEventId) {
        await eventsCol.doc(targetEventId).delete();
        res.status(200).json({ ok: true, uid, deletedId: targetEventId });
        return;
      }

      res.status(405).json({ ok: false, error: `Method ${req.method} not supported.` });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message || String(err) });
    }
    return;
  }

  const subPath = req.path.replace(/^\/api\/advocu\/?/, '');

  // Every /api/advocu/* route requires a signed-in Google user with approved GDE access (except self-delete)
  const advocuCaller = await gdeAccess.verifyGoogleUser(req, admin);
  if (!advocuCaller) {
    res.status(401).json({ ok: false, error: 'Sign in with Google first.' });
    return;
  }
  if (
    !(subPath === 'profile' && req.method === 'DELETE') &&
    !(await gdeAccess.hasGdeAccess(db, advocuCaller.uid))
  ) {
    res.status(403).json({ ok: false, error: 'GDE access has not been approved for this account.' });
    return;
  }

  // 0a. /api/advocu/extract-event: Fetch an Event/CFP URL and distill title, dates, city, country, campaign, cfpPlatform, sessionTitle using Advocu API + Gemini 3.8 Flash + JSON-LD/HTML baseline
  if (subPath === 'extract-event') {
    const rawUrl = String(req.query.url || req.body?.url || '').trim();
    const speaker = String(req.query.speaker || req.body?.speaker || '').trim();
    if (!rawUrl || !/^https?:\/\//i.test(rawUrl)) {
      res.status(400).json({ ok: false, error: 'Provide a valid http(s) Event URL.' });
      return;
    }
    try {
      const decodeEntities = (s) =>
        String(s || '')
          .replace(/&amp;/g, '&')
          .replace(/&#39;|&apos;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&ndash;|&#8211;/g, '-')
          .replace(/&mdash;|&#8212;/g, '—')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim();

      let title = '';
      let startDate = '';
      let endDate = '';
      let city = '';
      let country = '';
      let campaign = '';
      let cfpPlatform = '';
      let sessionTitle = '';
      let resolvedCfpUrl = rawUrl;
      let resolvedEventUrl = rawUrl;
      let aiDistilled = false;
      let gatherSummary = '';

      // 0a-1. Advocu Event/CFP SPA URL support (app.advocu.com/public/gde/events/<id> or app.advocu.com/events/<id>)
      const advocuMatch = rawUrl.match(
        /https?:\/\/app\.advocu\.com\/(?:(?:public\/)?[^/?#]+\/)?events\/([a-f0-9]{24})/i,
      );
      if (advocuMatch) {
        cfpPlatform = 'Advocu';
        const advEvent = await fetchAdvocuEventById(advocuMatch[1]);
        if (advEvent) {
          if (advEvent.title) title = decodeEntities(advEvent.title);
          if (advEvent.startDate) startDate = advEvent.startDate;
          if (advEvent.endDate) endDate = advEvent.endDate;
          if (advEvent.city) city = decodeEntities(advEvent.city);
          if (advEvent.country) country = decodeEntities(advEvent.country);
          if (advEvent.campaign) campaign = advEvent.campaign;
          if (advEvent.cfpUrl) resolvedCfpUrl = advEvent.cfpUrl;
          if (advEvent.externalUrl) resolvedEventUrl = advEvent.externalUrl;
          gatherSummary = [
            `Advocu Event ID: ${advEvent.id}`,
            `Event Name: ${advEvent.title}`,
            `Start ISO: ${advEvent.startDate}`,
            `End ISO: ${advEvent.endDate}`,
            `City: ${advEvent.city}`,
            `Country: ${advEvent.country}`,
            `Chapter: ${advEvent.chapterTitle}`,
            `External Event URL: ${advEvent.externalUrl}`,
            `Description: ${advEvent.description}`,
          ].join('\n');
        }
      }

      const fetchTargetUrl =
        advocuMatch && resolvedEventUrl !== rawUrl ? resolvedEventUrl : rawUrl;
      let html = '';
      if (!advocuMatch || fetchTargetUrl !== rawUrl) {
        try {
          const resp = await fetch(fetchTargetUrl, {
            method: 'GET',
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
            },
          });
          html = resp.ok ? await resp.text() : '';
        } catch {
          html = '';
        }
      }

      // 0b. Google Gather Platform SPA support (cloudonair.withgoogle.com/events/<slug>, rsvp.withgoogle.com/events/<slug>, etc.)
      const gatherMatch = rawUrl.match(/^https?:\/\/([^/]*withgoogle\.com)\/events\/([^/?#]+)/i);
      if (gatherMatch) {
        try {
          const gatherHost = gatherMatch[1];
          const gatherSlug = gatherMatch[2];
          const gatherResp = await fetch(`https://${gatherHost}/api/events/${gatherSlug}`, {
            headers: { Accept: 'application/json' },
          });
          if (gatherResp.ok) {
            const gData = await gatherResp.json();
            if (gData.name) title = decodeEntities(gData.name);
            if (gData.start && /^\d{4}-\d{2}-\d{2}/.test(String(gData.start))) {
              startDate = String(gData.start).slice(0, 10);
            }
            if (gData.end && /^\d{4}-\d{2}-\d{2}/.test(String(gData.end))) {
              endDate = String(gData.end).slice(0, 10);
            }
            const cleanDesc = decodeEntities(String(gData.description || '').replace(/<[^>]+>/g, ' '));
            gatherSummary = [
              `Event Name: ${gData.name || ''}`,
              `Slug: ${gData.url_slug || gatherSlug}`,
              `Start ISO: ${gData.start || ''}`,
              `End ISO: ${gData.end || ''}`,
              `Physical Venue / Location: ${gData.physical_location || ''}`,
              `Description: ${cleanDesc}`,
            ].join('\n');
          }
        } catch {
          // ignore Gather API errors
        }
      }

      // 1. Parse JSON-LD (@type: Event / EducationEvent / SocialEvent)
      const ldMatches = html.matchAll(
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      );
      for (const m of ldMatches) {
        try {
          const parsed = JSON.parse(m[1].trim());
          const items = Array.isArray(parsed)
            ? parsed
            : parsed['@graph'] && Array.isArray(parsed['@graph'])
              ? parsed['@graph']
              : [parsed];
          for (const item of items) {
            const t = String(item?.['@type'] || '');
            if (/Event/i.test(t)) {
              if (!title && item.name) title = decodeEntities(item.name);
              if (!startDate && item.startDate) startDate = String(item.startDate).slice(0, 10);
              if (!endDate && item.endDate) endDate = String(item.endDate).slice(0, 10);
              const loc = item.location;
              if (loc && typeof loc === 'object') {
                const addr = loc.address;
                if (addr && typeof addr === 'object') {
                  if (!city && addr.addressLocality) city = decodeEntities(addr.addressLocality);
                  if (!country && addr.addressCountry) {
                    country =
                      typeof addr.addressCountry === 'object'
                        ? decodeEntities(addr.addressCountry.name || '')
                        : decodeEntities(addr.addressCountry);
                  }
                } else if (typeof addr === 'string' && !city) {
                  const parts = addr.split(',').map((s) => s.trim()).filter(Boolean);
                  if (parts.length >= 2) {
                    city = parts[parts.length - 2];
                    country = parts[parts.length - 1];
                  }
                }
              }
            }
          }
        } catch {
          // ignore malformed JSON-LD
        }
      }

      // 2. Fallback to OpenGraph & <title>
      const ogTitle =
        html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
        html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i)?.[1] ||
        html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ||
        '';
      if (!title && ogTitle) {
        title = decodeEntities(ogTitle)
          .replace(/\s*[:|\-–—]\s*Call for (Speakers|Papers|Proposals).*$/i, '')
          .replace(/\s*[@|\-–—]\s*Sessionize.*$/i, '')
          .replace(/\s*\|\s*Google Developer Groups.*$/i, '')
          .trim();
      }

      const ogDesc = decodeEntities(
        html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
          html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
          '',
      );

      // Strip HTML tags to plain text for date, location & Gemini distillation
      const plainText = decodeEntities(
        html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' '),
      );

      // 3. Extract Sessionize "event date" or general dates if startDate is still empty
      const months = {
        jan: '01', january: '01',
        feb: '02', february: '02',
        mar: '03', march: '03',
        apr: '04', april: '04',
        may: '05',
        jun: '06', june: '06',
        jul: '07', july: '07',
        aug: '08', august: '08',
        sep: '09', sept: '09', september: '09',
        oct: '10', october: '10',
        nov: '11', november: '11',
        dec: '12', december: '12',
      };
      const toIso = (y, mName, d) => {
        const mm = months[String(mName).toLowerCase().slice(0, 3)];
        if (!mm) return '';
        return `${y}-${mm}-${String(d).padStart(2, '0')}`;
      };

      if (!startDate) {
        const eventDateSection =
          plainText.match(/event\s+dates?\s+([0-9]{1,2}\s+[A-Za-z]+\s+202\d|[A-Za-z]+\s+[0-9]{1,2},?\s+202\d)/i)?.[1] ||
          ogDesc ||
          plainText;
        const dmy = eventDateSection.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(202\d)\b/);
        const mdy = eventDateSection.match(/\b([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(202\d)\b/);
        const iso = eventDateSection.match(/\b(202\d-\d{2}-\d{2})\b/);
        if (iso) {
          startDate = iso[1];
        } else if (dmy) {
          startDate = toIso(dmy[3], dmy[2], dmy[1]);
        } else if (mdy) {
          startDate = toIso(mdy[3], mdy[1], mdy[2]);
        }
      }
      if (!endDate && startDate) {
        endDate = startDate;
      }

      // 4. Extract Sessionize location ("location [Venue] City, Country website") if city/country still empty
      if (!city && !country) {
        const locBlock = plainText.match(/\blocation\s+([\s\S]{3,120}?)(?:\s+website\b|\s+DevFest\b|$)/i)?.[1] || '';
        const cityCountry = (locBlock || plainText).match(
          /\b([A-ZÀ-ÖØ-Þ][A-Za-zß-öø-ÿ.\-' ]{1,28}),\s*([A-ZÀ-ÖØ-Þ][A-Za-zß-öø-ÿ.\-' ]{2,28})\s*$/,
        ) || plainText.match(
          /\blocation\s+([A-ZÀ-ÖØ-Þa-zß-öø-ÿ.\-' ]{2,35}),\s*([A-ZÀ-ÖØ-Þa-zß-öø-ÿ.\-' ]{2,35})\b/i,
        );
        if (cityCountry) {
          const rawCityPart = cityCountry[1].trim();
          const words = rawCityPart.split(/\s+/);
          city = words.length > 2 ? words.slice(-1)[0] : rawCityPart;
          country = cityCountry[2].trim();
        }
      }

      // 5. Distill with Gemini 3.8 Flash (Vertex AI on project andresara) for accurate structured extraction
      try {
        let accessToken = '';
        try {
          const cred = admin.app().options.credential;
          if (cred && typeof cred.getAccessToken === 'function') {
            const tok = await cred.getAccessToken();
            accessToken = tok?.access_token || '';
          }
        } catch {
          // fallback to metadata server below
        }
        if (!accessToken) {
          const metaResp = await fetch(
            'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
            { headers: { 'Metadata-Flavor': 'Google' } },
          );
          if (metaResp.ok) {
            const metaJson = await metaResp.json();
            accessToken = metaJson.access_token || '';
          }
        }

        if (accessToken) {
          const snippet = plainText.slice(0, 6000);
          const prompt = `You are an event metadata extractor for Google Developer Experts (GDEs).
Distill the conference/event details from the following webpage URL, metadata, and text.
URL: ${rawUrl}
Resolved External Event URL: ${resolvedEventUrl}
Speaker Name (optional): ${speaker}
Detected Title: ${title || ogTitle}
Detected Start Date: ${startDate}
Detected End Date: ${endDate}
Detected Description: ${ogDesc}
${gatherSummary ? `Structured Event API Data:\n${gatherSummary}\n` : ''}Webpage Text:
${snippet}

Return a JSON object with:
- title: Clean event or conference name (remove "Call for Papers", "Call for Speakers", "@ Sessionize.com", etc.)
- startDate: Event start date in YYYY-MM-DD format (use the actual conference/event date, NOT the CFP opening/closing date; empty string if unknown)
- endDate: Event end date in YYYY-MM-DD format (if single-day event, same as startDate; empty string if unknown)
- city: City name where the event takes place (strip venue/university/stadium/hotel names like "PGE Narodowy" and return the actual city name like "Warsaw", or "Online" if virtual)
- country: Country name in English (e.g., "Germany", "Poland", "Türkiye", "United Kingdom", "United States", "Kazakhstan", "Online")
- campaign: One of ["DevFest", "Build with AI", "I/O Extended", "GDG", "3rd-Party"]
- cfpPlatform: One of ["Sessionize", "Advocu", "Google Forms", "Bevy / GDG", "Other"]
- sessionTitle: If Speaker Name ("${speaker}") is listed on the event agenda or page with a talk/session title, return their talk/session title; otherwise empty string`;

          const geminiResp = await fetch(
            `https://aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/global/publishers/google/models/${GEMINI_MODEL}:generateContent`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.1,
                  responseSchema: {
                    type: 'OBJECT',
                    properties: {
                      title: { type: 'STRING' },
                      startDate: { type: 'STRING' },
                      endDate: { type: 'STRING' },
                      city: { type: 'STRING' },
                      country: { type: 'STRING' },
                      campaign: {
                        type: 'STRING',
                        enum: ['DevFest', 'Build with AI', 'I/O Extended', 'GDG', '3rd-Party'],
                      },
                      cfpPlatform: {
                        type: 'STRING',
                        enum: ['Sessionize', 'Advocu', 'Google Forms', 'Bevy / GDG', 'Other'],
                      },
                      sessionTitle: { type: 'STRING' },
                    },
                    required: [
                      'title',
                      'startDate',
                      'endDate',
                      'city',
                      'country',
                      'campaign',
                      'cfpPlatform',
                      'sessionTitle',
                    ],
                  },
                },
              }),
            },
          );

          if (geminiResp.ok) {
            const geminiData = await geminiResp.json();
            const rawJson = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (rawJson) {
              const ai = JSON.parse(rawJson);
              if (ai.title) title = String(ai.title).trim();
              if (ai.startDate && /^\d{4}-\d{2}-\d{2}$/.test(ai.startDate)) {
                startDate = ai.startDate;
              }
              if (ai.endDate && /^\d{4}-\d{2}-\d{2}$/.test(ai.endDate)) {
                endDate = ai.endDate;
              }
              if (ai.city) city = String(ai.city).trim();
              if (ai.country) country = String(ai.country).trim();
              if (ai.campaign) campaign = String(ai.campaign).trim();
              if (ai.cfpPlatform && !advocuMatch) cfpPlatform = String(ai.cfpPlatform).trim();
              if (ai.sessionTitle) sessionTitle = String(ai.sessionTitle).trim();
              aiDistilled = true;
            }
          }
        }
      } catch {
        // Fallback gracefully to deterministic extraction above
      }

      res.status(200).json({
        ok: true,
        aiDistilled,
        model: aiDistilled ? GEMINI_MODEL : advocuMatch ? 'advocu-api' : 'html-metadata',
        url: rawUrl,
        extracted: {
          title,
          startDate,
          endDate: endDate || startDate,
          city,
          country,
          campaign,
          cfpPlatform: advocuMatch ? 'Advocu' : cfpPlatform,
          sessionTitle,
          cfpUrl: resolvedCfpUrl,
          eventUrl: resolvedEventUrl,
        },
      });
    } catch (err) {
      res.status(200).json({
        ok: false,
        aiDistilled: false,
        url: rawUrl,
        extracted: {},
        error: String(err),
      });
    }
    return;
  }

  // 0a. /api/advocu/discover-events (and /api/advocu/emea-hub-events): Live Advocu OpenCFP & Events feed via Advocu Session + Public API
  if (subPath === 'discover-events' || subPath === 'emea-hub-events') {
    try {
      const force = req.query.refresh === '1' || req.query.force === 'true';
      const result = await fetchAdvocuDiscoverEvents(force);
      res.status(200).json({
        ok: true,
        source: 'advocu-opencfp',
        communityId: ADVOCU_COMMUNITY_ID,
        sessionActive: result.sessionActive,
        sessionError: result.sessionError,
        lastCheckedAt: result.lastCheckedAt,
        count: result.items.length,
        items: result.items,
      });
    } catch (err) {
      console.error('[Advocu Discover] Error fetching Advocu OpenCFP events:', err);
      res.status(502).json({ ok: false, error: 'Failed to load Advocu OpenCFP events.', items: [] });
    }
    return;
  }

  // 0a-2. /api/advocu/session-token: Validate & rotate a fresh Advocu Keycloak refresh_token into GCP Secret Manager (shared with AI Janise)
  if (subPath === 'session-token') {
    if (req.method === 'GET') {
      await getAdvocuKeycloakAccessToken();
      res.status(200).json({
        ok: true,
        sessionActive: lastAdvocuSessionState.active,
        sessionError: lastAdvocuSessionState.error,
        lastCheckedAt: lastAdvocuSessionState.lastCheckedAt,
      });
      return;
    }
    if (req.method !== 'POST') {
      res.status(405).json({ ok: false, error: 'Use GET or POST.' });
      return;
    }
    const uid = await verifyRequestFirebaseUid(req);
    if (!uid) {
      res.status(401).json({ ok: false, error: 'Sign in with Google first to update the Advocu session token.' });
      return;
    }
    let rawToken = String(req.body?.refreshToken || req.body?.token || '').trim();
    if (rawToken.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawToken);
        rawToken = String(parsed.refresh_token || parsed.refreshToken || '').trim();
      } catch {
        // treat as raw string
      }
    }
    const m = rawToken.match(/"refresh_token"\s*:\s*"([^"]+)"/);
    if (m) rawToken = m[1].trim();
    if (!rawToken) {
      res.status(400).json({ ok: false, error: 'Provide a valid Advocu refresh_token.' });
      return;
    }
    const accessToken = await getAdvocuKeycloakAccessToken(rawToken);
    if (!accessToken) {
      res.status(400).json({
        ok: false,
        sessionActive: false,
        error: lastAdvocuSessionState.error || 'Advocu rejected this refresh_token.',
      });
      return;
    }
    const refreshed = await fetchAdvocuDiscoverEvents(true);
    res.status(200).json({
      ok: true,
      sessionActive: true,
      count: refreshed.items.length,
      items: refreshed.items,
      message: `Advocu session refreshed & rotated in Secret Manager (${refreshed.items.length} upcoming OpenCFP events synced).`,
    });
    return;
  }

  // 0b. /api/advocu/gde-directory: Lookup GDE profile from https://me.developers.google.com/communities/experts
  if (subPath === 'gde-directory') {
    const name = String(req.query.name || req.body?.name || '');
    const email = String(req.query.email || req.body?.email || '');
    const slug = String(req.query.slug || req.body?.slug || '');
    try {
      const experts = await fetchGdeDirectoryList();
      const gdeDirectoryProfile = findAndFormatExpert(experts, { name, email, slug });
      res.status(200).json({
        ok: Boolean(gdeDirectoryProfile),
        totalDirectoryExperts: experts.length,
        gdeDirectoryProfile,
      });
    } catch (err) {
      console.error('[GDE Directory] Error:', err);
      res.status(502).json({ ok: false, error: 'Failed to lookup GDE directory profile.' });
    }
    return;
  }

  // 0c. /api/advocu/key: Single write-only endpoint for AES-256-GCM encryption & deletion of user's Advocu API key
  if (subPath === 'key') {
    const uid = await verifyRequestFirebaseUid(req);
    if (!uid) {
      res.status(401).json({ ok: false, error: 'Valid Firebase Auth ID token required.' });
      return;
    }
    try {
      const rawKey = req.method === 'DELETE' ? '' : String(req.body?.advocuApiKey || '');
      const outcome = await saveEncryptedAdvocuKeyForUid(uid, rawKey);
      res.status(200).json({ ok: true, ...outcome });
    } catch (err) {
      console.error(`[Advocu Vault] Key save error for UID ${uid}:`, err);
      res.status(500).json({ ok: false, error: 'Could not securely store Advocu API key.' });
    }
    return;
  }

  // 0d. /api/advocu/profile (DELETE): Atomically wipe user profile, events, and encrypted secrets via recursiveDelete
  if (subPath === 'profile' && req.method === 'DELETE') {
    const uid = await verifyRequestFirebaseUid(req);
    if (!uid) {
      res.status(401).json({ ok: false, error: 'Valid Firebase Auth ID token required.' });
      return;
    }
    try {
      const db = admin.firestore();
      const userRef = db.collection('gde_users').doc(uid);
      await db.recursiveDelete(userRef);
      res.status(200).json({ ok: true, deletedUid: uid });
    } catch (err) {
      console.error(`[Advocu Vault] Profile recursiveDelete failed for UID ${uid}:`, err);
      res.status(500).json({ ok: false, error: 'Could not delete cloud profile and secrets.' });
    }
    return;
  }

  const authHeader = req.headers.authorization || '';
  let token = authHeader.replace(/^Bearer\s+/i, '').trim() || (req.body && req.body.token) || '';
  const firebaseUid = await verifyRequestFirebaseUid(req);

  if (firebaseUid && (!token || isMaskedSentinel(token))) {
    token = await resolveAdvocuKeyForUid(firebaseUid);
  }

  if (!token || isMaskedSentinel(token)) {
    res.status(400).json({ error: 'Missing or undecryptable Advocu API key. Please re-enter your key in Settings.' });
    return;
  }

  // 1. /api/advocu/sync: Call GET /personal-api/v1/gde/activities + lookup me.developers.google.com/communities/experts
  if (subPath === 'sync' || subPath === '') {
    const jwtClaims = decodeJwtPayload(token);
    const results = {
      connected: true,
      authValid: false,
      jwtClaims,
      profileData: null,
      gdeDirectoryProfile: null,
      activities: [],
      probedStatus: {},
    };

    try {
      const [r, experts] = await Promise.all([
        fetch(`${ADVOCU_BASE}/activities?size=100`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }),
        fetchGdeDirectoryList().catch(() => []),
      ]);
      results.probedStatus.activities = r.status;
      if (r.status !== 401 && r.status !== 403) {
        results.authValid = true;
      }
      if (r.ok) {
        const body = await r.json().catch(() => null);
        if (Array.isArray(body)) {
          results.activities = body;
        } else if (body && Array.isArray(body.content || body.items || body.results)) {
          results.activities = body.content || body.items || body.results;
        }
      }
      if (experts.length > 0) {
        results.gdeDirectoryProfile = findAndFormatExpert(experts, {
          name: req.body?.name || '',
          email: req.body?.email || '',
          slug: req.body?.slug || '',
        });
      }
    } catch (e) {
      results.probedStatus.activities = 'error';
    }

    res.status(200).json(results);
    return;
  }

  // 2. Forward POST / GET to https://api.advocu.com/personal-api/v1/gde/${subPath}
  try {
    const targetUrl = `${ADVOCU_BASE}/${subPath}`;
    let bodyToSend = req.body && typeof req.body === 'object' ? { ...req.body } : req.body;

    if (req.method === 'POST' && subPath.startsWith('activity-drafts/') && bodyToSend && typeof bodyToSend === 'object') {
      const tagMap = {
        AI: 'AI',
        Cloud: 'Google Cloud',
        'Google Cloud': 'Google Cloud',
        Firebase: 'Firebase',
        Android: 'Android',
        Web: 'Web',
        Flutter: 'Dart - Flutter',
        'Dart - Flutter': 'Dart - Flutter',
        Angular: 'Angular',
        Go: 'Golang',
        Golang: 'Golang',
        Workspace: 'Google Workspace',
        'Google Workspace': 'Google Workspace',
        DevFest: 'DevFest',
        'Build with AI': 'Build with AI',
        'I/O Extended': 'Google I/O Extended',
        'Google I/O Extended': 'Google I/O Extended',
      };

      if (Array.isArray(bodyToSend.tags)) {
        const mappedTags = Array.from(
          new Set(
            bodyToSend.tags
              .map((t) => (typeof t === 'string' ? tagMap[t.trim()] || null : null))
              .filter(Boolean),
          ),
        );
        if (mappedTags.length > 0) {
          bodyToSend.tags = mappedTags;
        } else {
          delete bodyToSend.tags;
        }
      }

      // Advocu API rule: `inPersonAttendees` is accepted ONLY when `eventFormat` is `Hybrid`.
      if (bodyToSend.eventFormat !== 'Hybrid') {
        delete bodyToSend.inPersonAttendees;
      } else if (bodyToSend.inPersonAttendees !== undefined) {
        const totalAtt = Number(bodyToSend.metrics?.attendees) || 1;
        bodyToSend.inPersonAttendees = Math.min(
          totalAtt,
          Math.max(0, Math.round(Number(bodyToSend.inPersonAttendees) || 0)),
        );
      }

      // Advocu API rule: `country` is accepted ONLY when `eventFormat` is `In-Person` or `Hybrid`.
      if (bodyToSend.eventFormat !== 'In-Person' && bodyToSend.eventFormat !== 'Hybrid') {
        delete bodyToSend.country;
      } else if (typeof bodyToSend.country === 'string') {
        const c = bodyToSend.country.trim();
        if (!c || /^(online|virtual|remote)$/i.test(c)) {
          delete bodyToSend.country;
        } else {
          bodyToSend.country = c.slice(0, 100);
        }
      }

      if (typeof bodyToSend.title === 'string') {
        const t = bodyToSend.title.trim();
        bodyToSend.title = (t.length < 3 ? `${t} Talk` : t).slice(0, 200);
      }
      if (typeof bodyToSend.description === 'string') {
        bodyToSend.description = bodyToSend.description.slice(0, 2000);
      }
      if (typeof bodyToSend.additionalInfo === 'string') {
        bodyToSend.additionalInfo = bodyToSend.additionalInfo.slice(0, 2000);
      }
      if (typeof bodyToSend.activityUrl === 'string') {
        const u = bodyToSend.activityUrl.trim();
        bodyToSend.activityUrl = (/^https?:\/\//i.test(u) ? u : `https://${u}`).slice(0, 500);
      }
    }

    const sendUpstream = async (payloadObj) =>
      fetch(targetUrl, {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: req.method === 'POST' ? JSON.stringify(payloadObj) : undefined,
      });

    let upstream = await sendUpstream(bodyToSend);
    let text = await upstream.text();

    // If Advocu rejected a draft with 400 (e.g., future activityDate or unrecognized country/tag), log and auto-heal once
    if (
      upstream.status === 400 &&
      req.method === 'POST' &&
      subPath.startsWith('activity-drafts/') &&
      bodyToSend &&
      typeof bodyToSend === 'object'
    ) {
      console.warn('[Advocu Proxy] 400 validation response:', text, 'Payload:', JSON.stringify(bodyToSend));
      const retryBody = { ...bodyToSend };
      let changed = false;
      const todayUtc = new Date().toISOString().slice(0, 10);

      if (
        /activityDate/i.test(text) ||
        (typeof retryBody.activityDate === 'string' && retryBody.activityDate > todayUtc)
      ) {
        retryBody.activityDate = todayUtc;
        changed = true;
      }
      if (/inPersonAttendees/i.test(text) && 'inPersonAttendees' in retryBody) {
        delete retryBody.inPersonAttendees;
        changed = true;
      }
      if (/country/i.test(text) && 'country' in retryBody) {
        delete retryBody.country;
        changed = true;
      }
      if (/tags/i.test(text) && 'tags' in retryBody) {
        delete retryBody.tags;
        changed = true;
      }

      if (changed) {
        upstream = await sendUpstream(retryBody);
        text = await upstream.text();
      }
    }

    res.status(upstream.status).send(text);
  } catch (err) {
    console.error('[Advocu Proxy] Upstream request failed:', err);
    res.status(502).json({ error: 'Upstream Advocu API request failed.' });
  }
});
