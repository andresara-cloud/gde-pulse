import { type GdeEvent, resolveRegion } from './policy.ts';

export type SqlColumnType = 'string' | 'number' | 'boolean';

export interface ColumnSpec {
  type: SqlColumnType;
  mutable: boolean;
  required?: boolean;
  maxLen?: number;
  enumValues?: readonly (string | number)[];
  description: string;
}

export const EVENT_COLUMN_SCHEMA: Record<string, ColumnSpec> = {
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

export const ALLOWED_EVENT_COLUMNS = Object.keys(EVENT_COLUMN_SCHEMA);

export function validateEventPatch(
  patch: Record<string, unknown>,
  options: { isCreate?: boolean } = {},
): Record<string, unknown> {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
    throw new Error('Schema Lock Error: Payload must be a JSON object.');
  }
  const keys = Object.keys(patch);
  if (keys.length === 0) {
    throw new Error('Schema Lock Error: At least one valid field must be provided.');
  }

  const validated: Record<string, unknown> = {};

  for (const key of keys) {
    const spec = EVENT_COLUMN_SCHEMA[key];
    if (!spec) {
      throw new Error(
        `Schema Lock Error: Unknown field '${key}'. Schema changes and extra fields are forbidden.`,
      );
    }
    if (!spec.mutable && !options.isCreate) {
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
        throw new Error(
          `Schema Type Error: Field '${key}' expects a non-negative number, got ${JSON.stringify(val)}.`,
        );
      }
    } else if (spec.type === 'boolean') {
      if (typeof val !== 'boolean') {
        throw new Error(`Schema Type Error: Field '${key}' expects boolean, got ${typeof val}.`);
      }
    }

    if (spec.enumValues && !spec.enumValues.includes(val as never)) {
      throw new Error(
        `Schema Enum Error: Invalid value ${JSON.stringify(val)} for '${key}'. Allowed: ${spec.enumValues.join(', ')}.`,
      );
    }

    validated[key] = val;
  }

  // Auto-keep status in sync when checkboxes change unless status was explicitly provided
  if (!('status' in validated)) {
    if (validated.eventApproved === true) {
      validated.status = 'Confirmed';
    } else if (validated.eventApplied === true && validated.eventApproved === false) {
      validated.status = 'Applied';
    }
  }
  if ('worktripsApproved' in validated) {
    validated.budgetApproved = Boolean(validated.worktripsApproved);
    if (validated.worktripsApproved === true) {
      validated.travelApprovalStatus = 'Approved';
    }
  }

  return validated;
}

function parseSqlLiteral(raw: string): string | number | boolean {
  const s = raw.trim();
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1).replace(/''/g, "'");
  }
  if (/^true$/i.test(s)) return true;
  if (/^false$/i.test(s)) return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  throw new Error(
    `SQL Syntax Error: Invalid literal ${s}. Wrap strings in single quotes (e.g. 'DevFest'), or use true/false/numbers.`,
  );
}

function splitTopLevel(input: string, delimiter: string): string[] {
  const result: string[] = [];
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

function evaluateWhereClause(row: Record<string, unknown>, whereSql: string): boolean {
  if (!whereSql || !whereSql.trim()) return true;
  const orGroups = splitTopLevel(whereSql, ' OR ');
  return orGroups.some((orPart) => {
    const andClauses = splitTopLevel(orPart, ' AND ');
    return andClauses.every((clause) => {
      const m = clause.match(/^([a-zA-Z0-9_]+)\s*(=|!=|<>|>=|<=|>|<|LIKE|ILIKE)\s*(.+)$/i);
      if (!m) {
        throw new Error(`SQL Syntax Error: Invalid WHERE condition '${clause}'.`);
      }
      const [, col, opRaw, valRaw] = m;
      if (!EVENT_COLUMN_SCHEMA[col]) {
        throw new Error(
          `Schema Lock Error: Unknown column '${col}' in WHERE clause. Allowed columns: ${ALLOWED_EVENT_COLUMNS.join(', ')}`,
        );
      }
      const expected = parseSqlLiteral(valRaw);
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

export interface SqlExecutionResult {
  command: 'SELECT' | 'UPDATE' | 'INSERT' | 'DELETE' | 'DESCRIBE';
  affectedCount: number;
  rows: Record<string, unknown>[];
  upsertedEvents: GdeEvent[];
  deletedEventIds: string[];
  allEvents: GdeEvent[];
}

export function executeLockedSql(sqlRaw: string, currentEvents: GdeEvent[]): SqlExecutionResult {
  const cleaned = sqlRaw
    .replace(/--.*$/gm, '')
    .trim()
    .replace(/;+\s*$/, '')
    .trim();

  if (!cleaned) {
    throw new Error('SQL Error: Empty SQL query.');
  }

  // Block multi-statement SQL injection outside string literals
  if (splitTopLevel(cleaned, ';').length > 1) {
    throw new Error('Security Error: Multiple SQL statements in a single request are forbidden.');
  }

  const firstWord = (cleaned.split(/\s+/)[0] || '').toUpperCase();
  const forbiddenDdl = new Set([
    'ALTER',
    'DROP',
    'CREATE',
    'TRUNCATE',
    'RENAME',
    'GRANT',
    'REVOKE',
    'PRAGMA',
    'ATTACH',
    'DETACH',
  ]);
  if (forbiddenDdl.has(firstWord)) {
    throw new Error(
      `Schema Lock Error: '${firstWord}' statements are strictly forbidden. You can query and modify data in 'events', but schema changes and extra columns are locked.`,
    );
  }

  // 1. DESCRIBE events / SHOW COLUMNS FROM events
  if (/^(DESCRIBE|DESC)\s+events$/i.test(cleaned) || /^SHOW\s+COLUMNS\s+FROM\s+events$/i.test(cleaned)) {
    const schemaRows = Object.entries(EVENT_COLUMN_SCHEMA).map(([column, spec]) => ({
      column,
      type: spec.type,
      mutable: spec.mutable,
      required: Boolean(spec.required),
      allowedValues: spec.enumValues ? spec.enumValues.join(' | ') : '*',
      description: spec.description,
    }));
    return {
      command: 'DESCRIBE',
      affectedCount: schemaRows.length,
      rows: schemaRows,
      upsertedEvents: [],
      deletedEventIds: [],
      allEvents: currentEvents,
    };
  }

  // 2. SELECT <cols> FROM events [WHERE ...] [ORDER BY ...] [LIMIT ...]
  if (firstWord === 'SELECT') {
    const m = cleaned.match(
      /^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+?))?(?:\s+ORDER\s+BY\s+([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?)?(?:\s+LIMIT\s+(\d+))?$/i,
    );
    if (!m) {
      throw new Error(
        "SQL Syntax Error: Expected `SELECT <columns> FROM events [WHERE ...] [ORDER BY <col> ASC|DESC] [LIMIT <n>]`.",
      );
    }
    const [, colsRaw, tableName, whereClause, orderCol, orderDir, limitRaw] = m;
    if (tableName.toLowerCase() !== 'events') {
      throw new Error(`Schema Lock Error: Unknown table '${tableName}'. Only the 'events' table exists.`);
    }

    const selectAll = colsRaw.trim() === '*';
    const selectedCols = selectAll
      ? ALLOWED_EVENT_COLUMNS
      : colsRaw.split(',').map((c) => c.trim()).filter(Boolean);

    for (const col of selectedCols) {
      if (!EVENT_COLUMN_SCHEMA[col]) {
        throw new Error(
          `Schema Lock Error: Unknown column '${col}' in SELECT list. Run 'DESCRIBE events' to view allowed columns.`,
        );
      }
    }
    if (orderCol && !EVENT_COLUMN_SCHEMA[orderCol]) {
      throw new Error(`Schema Lock Error: Unknown column '${orderCol}' in ORDER BY.`);
    }

    let matched = currentEvents.filter((ev) =>
      evaluateWhereClause(ev as unknown as Record<string, unknown>, whereClause || ''),
    );

    if (orderCol) {
      const dir = (orderDir || 'ASC').toUpperCase() === 'DESC' ? -1 : 1;
      matched = [...matched].sort((a, b) => {
        const va = (a as unknown as Record<string, unknown>)[orderCol] ?? '';
        const vb = (b as unknown as Record<string, unknown>)[orderCol] ?? '';
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb)) * dir;
      });
    }

    if (limitRaw) {
      matched = matched.slice(0, Number(limitRaw));
    }

    const projected = matched.map((ev) => {
      const obj: Record<string, unknown> = {};
      for (const col of selectedCols) {
        obj[col] = (ev as unknown as Record<string, unknown>)[col] ?? null;
      }
      return obj;
    });

    return {
      command: 'SELECT',
      affectedCount: projected.length,
      rows: projected,
      upsertedEvents: [],
      deletedEventIds: [],
      allEvents: currentEvents,
    };
  }

  // 3. UPDATE events SET col = val, ... WHERE ...
  if (firstWord === 'UPDATE') {
    const m = cleaned.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!m) {
      throw new Error("SQL Syntax Error: Expected `UPDATE events SET col = val WHERE ...`.");
    }
    const [, tableName, setClause, whereClause] = m;
    if (tableName.toLowerCase() !== 'events') {
      throw new Error(`Schema Lock Error: Unknown table '${tableName}'. Only the 'events' table exists.`);
    }
    if (!whereClause || !whereClause.trim()) {
      throw new Error(
        "Safety Error: `UPDATE events` requires a `WHERE` clause (e.g. `WHERE id = '...'` or `WHERE country = 'Germany'`).",
      );
    }

    const assignments = splitTopLevel(setClause, ',');
    const rawPatch: Record<string, unknown> = {};
    for (const assign of assignments) {
      const eqIdx = assign.indexOf('=');
      if (eqIdx === -1) {
        throw new Error(`SQL Syntax Error: Invalid SET assignment '${assign}'.`);
      }
      const col = assign.slice(0, eqIdx).trim();
      const valStr = assign.slice(eqIdx + 1).trim();
      rawPatch[col] = parseSqlLiteral(valStr);
    }

    const validatedPatch = validateEventPatch(rawPatch, { isCreate: false });
    const nowIso = new Date().toISOString();
    const upsertedEvents: GdeEvent[] = [];

    const nextEvents = currentEvents.map((ev) => {
      const matches = evaluateWhereClause(ev as unknown as Record<string, unknown>, whereClause);
      if (!matches) return ev;
      const updated: GdeEvent = {
        ...ev,
        ...(validatedPatch as Partial<GdeEvent>),
        updatedAt: nowIso,
      };
      if ('country' in validatedPatch && !('region' in validatedPatch)) {
        updated.region = resolveRegion(updated.country);
      }
      upsertedEvents.push(updated);
      return updated;
    });

    return {
      command: 'UPDATE',
      affectedCount: upsertedEvents.length,
      rows: upsertedEvents.map((e) => ({
        id: e.id,
        title: e.title,
        sessionTitle: e.sessionTitle,
        startDate: e.startDate,
        status: e.status,
        budgetUsd: e.budgetUsd,
        eventApplied: Boolean(e.eventApplied),
        eventApproved: Boolean(e.eventApproved),
        worktripsRequested: Boolean(e.worktripsRequested),
        worktripsApproved: Boolean(e.worktripsApproved),
      })),
      upsertedEvents,
      deletedEventIds: [],
      allEvents: nextEvents,
    };
  }

  // 4. INSERT INTO events (col1, col2, ...) VALUES (val1, val2, ...)
  if (firstWord === 'INSERT') {
    const m = cleaned.match(
      /^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]+)\)$/i,
    );
    if (!m) {
      throw new Error(
        "SQL Syntax Error: Expected `INSERT INTO events (title, sessionTitle, country, startDate, budgetUsd) VALUES ('...', '...', '...', '2026-10-15', 800)`.",
      );
    }
    const [, tableName, colsPart, valsPart] = m;
    if (tableName.toLowerCase() !== 'events') {
      throw new Error(`Schema Lock Error: Unknown table '${tableName}'. Only the 'events' table exists.`);
    }
    const cols = colsPart.split(',').map((c) => c.trim()).filter(Boolean);
    const vals = splitTopLevel(valsPart, ',').map((v) => parseSqlLiteral(v));
    if (cols.length !== vals.length) {
      throw new Error(
        `SQL Syntax Error: Column count (${cols.length}) does not match value count (${vals.length}).`,
      );
    }

    const rawObj: Record<string, unknown> = {};
    for (let i = 0; i < cols.length; i++) {
      rawObj[cols[i]] = vals[i];
    }

    const validated = validateEventPatch(rawObj, { isCreate: true });
    if (!validated.title || !validated.country || !validated.startDate) {
      throw new Error(
        "Schema Lock Error: `INSERT INTO events` requires at least `title`, `country`, and `startDate`.",
      );
    }

    const country = String(validated.country);
    const region = (validated.region as GdeEvent['region']) || resolveRegion(country);
    const startDate = String(validated.startDate);
    const endDate = String(validated.endDate || startDate);
    const nowIso = new Date().toISOString();

    const newEvent: GdeEvent = {
      id: String(validated.id || `sql-${Date.now()}`),
      title: String(validated.title),
      sessionTitle: String(validated.sessionTitle || ''),
      campaign: (validated.campaign as GdeEvent['campaign']) || 'DevFest',
      city: String(validated.city || ''),
      country,
      region,
      startDate,
      endDate,
      status: (validated.status as GdeEvent['status']) || (validated.eventApproved ? 'Confirmed' : 'Applied'),
      cfpPlatform: (validated.cfpPlatform as GdeEvent['cfpPlatform']) || 'Direct / Other',
      cfpUrl: String(validated.cfpUrl || ''),
      eventUrl: String(validated.eventUrl || ''),
      activityType: (validated.activityType as GdeEvent['activityType']) || 'Talk',
      eventFormat: (validated.eventFormat as GdeEvent['eventFormat']) || 'In-Person',
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

    const nextEvents = [newEvent, ...currentEvents.filter((e) => e.id !== newEvent.id)];
    return {
      command: 'INSERT',
      affectedCount: 1,
      rows: [newEvent as unknown as Record<string, unknown>],
      upsertedEvents: [newEvent],
      deletedEventIds: [],
      allEvents: nextEvents,
    };
  }

  // 5. DELETE FROM events WHERE ...
  if (firstWord === 'DELETE') {
    const m = cleaned.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!m) {
      throw new Error("SQL Syntax Error: Expected `DELETE FROM events WHERE ...`.");
    }
    const [, tableName, whereClause] = m;
    if (tableName.toLowerCase() !== 'events') {
      throw new Error(`Schema Lock Error: Unknown table '${tableName}'. Only the 'events' table exists.`);
    }
    if (!whereClause || !whereClause.trim()) {
      throw new Error("Safety Error: `DELETE FROM events` requires a `WHERE` clause.");
    }

    const deletedRows: Record<string, unknown>[] = [];
    const deletedEventIds: string[] = [];
    const nextEvents = currentEvents.filter((ev) => {
      const matches = evaluateWhereClause(ev as unknown as Record<string, unknown>, whereClause);
      if (matches) {
        deletedRows.push({ id: ev.id, title: ev.title, startDate: ev.startDate });
        deletedEventIds.push(ev.id);
        return false;
      }
      return true;
    });

    return {
      command: 'DELETE',
      affectedCount: deletedEventIds.length,
      rows: deletedRows,
      upsertedEvents: [],
      deletedEventIds,
      allEvents: nextEvents,
    };
  }

  throw new Error(
    `Unsupported SQL command '${firstWord}'. Allowed commands: SELECT, UPDATE, INSERT, DELETE, DESCRIBE.`,
  );
}
