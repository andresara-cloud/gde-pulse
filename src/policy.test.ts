import assert from 'node:assert/strict';
import {
  calculateBudgetUsd,
  DEFAULT_ANDRES_PROFILE,
  detectConflicts,
  evaluateTravelWorkflow,
  type GdeEvent,
  resolveRegion,
} from './policy.ts';

// 1. Default profile starts blank (no pre-populated emails, country, or categories)
assert.equal(DEFAULT_ANDRES_PROFILE.displayName, '');
assert.equal(DEFAULT_ANDRES_PROFILE.email, '');
assert.equal(DEFAULT_ANDRES_PROFILE.sessionizeEmail, '');
assert.equal(DEFAULT_ANDRES_PROFILE.homeCountry, '');
assert.deepEqual(DEFAULT_ANDRES_PROFILE.categories, []);

// 2. Default budget tiers ($600 / $800 / $1,200)
assert.equal(resolveRegion('Germany'), 'Europe');
assert.equal(calculateBudgetUsd('Europe', 'Europe', 'Germany', 'Germany'), 600);
assert.equal(calculateBudgetUsd('Europe', 'Europe', 'Spain', 'Germany'), 800);
assert.equal(calculateBudgetUsd('MENAT', 'Europe', 'Egypt', 'Germany'), 1200);

// 3. Date conflict detection + 21-day reimbursement submission date red-flagging
const baseEvent: GdeEvent = {
  id: 'ev-1',
  title: 'DevFest Berlin',
  campaign: 'DevFest',
  city: 'Berlin',
  country: 'Germany',
  region: 'Europe',
  startDate: '2026-11-14',
  endDate: '2026-11-15',
  status: 'Confirmed',
  cfpPlatform: 'Sessionize',
  cfpUrl: 'https://sessionize.com/devfest-berlin',
  eventUrl: 'https://gdg.community.dev/events/details/devfest-berlin',
  sessionTitle: 'Agentic AI with Gemini',
  activityType: 'Talk',
  eventFormat: 'In-Person',
  expectedAudience: 450,
  isGdgOnCampus: false,
  budgetUsd: 600,
  worktripsRequested: true,
  worktripsApproved: true,
  worktripsTravelRequested: true,
  worktripsTravelApproved: true,
  budgetApproved: true,
  bookingMode: 'Reimbursement',
  travelApprovalStatus: 'Approved',
  flightBooked: true,
  hotelBooked: true,
  worktripsRef: '',
  reimbursementSubmitted: false,
  reimbursementSubmittedDate: '',
  reimbursementAmountUsd: 550,
  advocuSynced: false,
  photos: [],
  notes: '',
  updatedAt: '2026-10-08',
};

const overlappingEvent: GdeEvent = {
  ...baseEvent,
  id: 'ev-2',
  title: 'DevFest Vienna',
  city: 'Vienna',
  country: 'Austria',
  startDate: '2026-11-15',
  endDate: '2026-11-16',
  status: 'Applied',
  budgetUsd: 800,
};

const conflicts = detectConflicts([baseEvent, overlappingEvent]);
assert.equal(conflicts.get('ev-1')?.[0]?.severity, 'overlap');

// Two sessions at the SAME event (same title or city/date) should NOT be flagged as overlapping
const secondSessionSameEvent: GdeEvent = {
  ...baseEvent,
  id: 'ev-1-session-2',
  title: 'DevFest Berlin 2026',
  sessionTitle: 'Workshop: Building Multi-Agent Systems',
};
const sameEventConflicts = detectConflicts([baseEvent, secondSessionSameEvent]);
assert.equal((sameEventConflicts.get('ev-1') ?? []).length, 0);
assert.equal((sameEventConflicts.get('ev-1-session-2') ?? []).length, 0);

// Completed events should NEVER be flagged as overlapping
const completedEvent: GdeEvent = {
  ...overlappingEvent,
  id: 'ev-completed',
  status: 'Completed',
};
const completedConflicts = detectConflicts([baseEvent, completedEvent]);
assert.equal((completedConflicts.get('ev-1') ?? []).length, 0);
assert.equal((completedConflicts.get('ev-completed') ?? []).length, 0);

// Case A: Submitted within ±21 days of event -> NOT red-flagged
const submittedOnTime = evaluateTravelWorkflow(
  {
    ...baseEvent,
    reimbursementSubmitted: true,
    reimbursementSubmittedDate: '2026-11-25', // 10 days after endDate (2026-11-15)
  },
  '2026-11-25',
);
assert.equal(submittedOnTime.isRedAlert, false);
assert.equal(submittedOnTime.reimbursementState, 'submitted-on-time');

// Case B: Submitted >21 days BEFORE startDate -> RED-FLAGGED
const submittedTooEarly = evaluateTravelWorkflow(
  {
    ...baseEvent,
    reimbursementSubmitted: true,
    reimbursementSubmittedDate: '2026-10-15', // 30 days before startDate (2026-11-14)
  },
  '2026-10-15',
);
assert.equal(submittedTooEarly.isRedAlert, true);
assert.equal(submittedTooEarly.reimbursementState, 'flagged-red');

import { parseAdvocuMyEventsTable } from './integrations.ts';

// Case C: Submitted >21 days AFTER endDate -> RED-FLAGGED
const submittedTooLate = evaluateTravelWorkflow(
  {
    ...baseEvent,
    reimbursementSubmitted: true,
    reimbursementSubmittedDate: '2026-12-15', // 30 days after endDate (2026-11-15)
  },
  '2026-12-15',
);
assert.equal(submittedTooLate.isRedAlert, true);
assert.equal(submittedTooLate.reimbursementState, 'flagged-red');

// Case D: Advocu "My Events" table copy-paste parser
const sampleAdvocuTable = `
DevFest Trabzon 2026
Call for Papers for Devfest Trabzon 2026
Building Agents with Gemini: From Prototype to Production
Aug 19, 2026
Oct 31, 2026
Accepted
Almaty devfest '26
DevFest Almaty 2026 — Call for Papers
Prompt to Production: Consistent AI Engineering
Aug 6, 2026
Nov 13, 2026
Pending
`;
const parsedMyEvents = parseAdvocuMyEventsTable(sampleAdvocuTable, {
  ...DEFAULT_ANDRES_PROFILE,
  homeCountry: 'Germany',
  homeRegion: 'Europe',
});
assert.equal(parsedMyEvents.length, 2);
assert.equal(parsedMyEvents[0].title, 'DevFest Trabzon 2026');
assert.equal(parsedMyEvents[0].status, 'Confirmed');
assert.equal(parsedMyEvents[0].startDate, '2026-10-31');
assert.equal(parsedMyEvents[1].title, "Almaty devfest '26");
assert.equal(parsedMyEvents[1].status, 'Applied');
assert.equal(parsedMyEvents[1].startDate, '2026-11-13');

// Case E: Schema-Locked SQL & Agent Validation Engine (Option 1 + Option 2)
import { executeLockedSql, validateEventPatch } from './sqlEngine.ts';

const selectRes = executeLockedSql(
  "SELECT id, title, sessionTitle, budgetUsd FROM events WHERE country = 'Germany'",
  [baseEvent, overlappingEvent],
);
assert.equal(selectRes.command, 'SELECT');
assert.equal(selectRes.rows.length, 1);
assert.equal(selectRes.rows[0].title, 'DevFest Berlin');

const updateRes = executeLockedSql(
  "UPDATE events SET sessionTitle = 'Updated Talk Title', eventApproved = true, budgetUsd = 1200 WHERE id = 'ev-2'",
  [baseEvent, overlappingEvent],
);
assert.equal(updateRes.command, 'UPDATE');
assert.equal(updateRes.affectedCount, 1);
assert.equal(updateRes.upsertedEvents[0].sessionTitle, 'Updated Talk Title');
assert.equal(updateRes.upsertedEvents[0].eventApproved, true);
assert.equal(updateRes.upsertedEvents[0].status, 'Confirmed');
assert.equal(updateRes.upsertedEvents[0].budgetUsd, 1200);

// Strictly block DDL (ALTER, DROP, CREATE)
assert.throws(
  () => executeLockedSql('ALTER TABLE events ADD COLUMN extraField VARCHAR(50)', [baseEvent]),
  /Schema Lock Error.*ALTER/,
);
assert.throws(
  () => executeLockedSql('DROP TABLE events', [baseEvent]),
  /Schema Lock Error.*DROP/,
);

// Strictly block unknown columns & immutable primary key modifications
assert.throws(
  () => executeLockedSql("UPDATE events SET extraColumn = 'abc' WHERE id = 'ev-1'", [baseEvent]),
  /Schema Lock Error: Unknown field 'extraColumn'/,
);
assert.throws(
  () => executeLockedSql("UPDATE events SET id = 'hacked' WHERE id = 'ev-1'", [baseEvent]),
  /Schema Lock Error: Field 'id' is immutable/,
);
assert.throws(
  () => validateEventPatch({ unknownField: 123 }),
  /Schema Lock Error: Unknown field 'unknownField'/,
);
assert.throws(
  () => validateEventPatch({ budgetUsd: 9999 }),
  /Schema Enum Error/,
);

import { getSpeakerMatchingSessions } from './integrations.ts';

// Case F: Speaker Matching / Advocu session title extraction for Step 2 autocomplete
const speakerSessions = getSpeakerMatchingSessions([
  ...parsedMyEvents,
  baseEvent,
  secondSessionSameEvent,
]);
assert.equal(speakerSessions.includes('Building Agents with Gemini: From Prototype to Production'), true);
assert.equal(speakerSessions.includes('Prompt to Production: Consistent AI Engineering'), true);
assert.equal(speakerSessions.includes('Agentic AI with Gemini'), true);

// Case G: Discover region resolution for Bevy country_name & ISO-2 codes
assert.equal(resolveRegion('United States of America', 'Europe', 'US'), 'NA');
assert.equal(resolveRegion('Taiwan', 'Europe', 'TW'), 'APAC');
assert.equal(resolveRegion('Congo (the Democratic Republic of the)', 'Europe', 'CD'), 'SSA');
assert.equal(resolveRegion("Côte d'Ivoire", 'Europe', 'CI'), 'SSA');
assert.equal(resolveRegion('Honduras', 'Europe', 'HN'), 'LATAM');
assert.equal(resolveRegion('Israel', 'Europe', 'IL'), 'MENAT');
assert.equal(resolveRegion('Sweden', 'Europe', 'SE'), 'Europe');

import { evaluateDiscoverConferenceRow, matchDiscoverWithItinerary } from './policy.ts';

// Case H: Discover status & Confirmed-only clash detection
const itineraryForDiscover: GdeEvent[] = [
  { ...baseEvent, id: 'conf-1', title: 'DevFest Berlin 2026', city: 'Berlin', country: 'Germany', startDate: '2026-11-14', endDate: '2026-11-14', status: 'Confirmed', eventApproved: true },
  { ...baseEvent, id: 'app-1', title: 'DevFest London 2026', city: 'London', country: 'United Kingdom', startDate: '2026-11-21', endDate: '2026-11-21', status: 'Applied', eventApproved: false },
];

// 1) Same event as Confirmed -> matchedStatus = 'Confirmed', no self-clash
const sameConfirmed = matchDiscoverWithItinerary(
  { title: 'DevFest Berlin 2026', city: 'Berlin', country: 'Germany', startDate: '2026-11-14', endDate: '2026-11-14' },
  itineraryForDiscover,
);
assert.equal(sameConfirmed.matchedStatus, 'Confirmed');
assert.deepEqual(sameConfirmed.clashesWithConfirmed, []);

// 2) Different event on same date as Confirmed -> clashesWithConfirmed = ['DevFest Berlin 2026']
const clashingWithConfirmed = matchDiscoverWithItinerary(
  { title: 'Chatbot Summit', city: 'Amsterdam', country: 'Netherlands', startDate: '2026-11-14', endDate: '2026-11-15' },
  itineraryForDiscover,
);
assert.equal(clashingWithConfirmed.matchedStatus, null);
assert.deepEqual(clashingWithConfirmed.clashesWithConfirmed, ['DevFest Berlin 2026']);

// 3) Same event as Applied -> matchedStatus = 'Applied'
const sameApplied = matchDiscoverWithItinerary(
  { title: 'DevFest London 2026', city: 'London', country: 'United Kingdom', startDate: '2026-11-21', endDate: '2026-11-21' },
  itineraryForDiscover,
);
assert.equal(sameApplied.matchedStatus, 'Applied');

// 4) Different event on same date as Applied (NOT Confirmed) -> clashesWithConfirmed = []
const overlappingAppliedOnly = matchDiscoverWithItinerary(
  { title: 'Big Data Conference Europe', city: 'Vilnius', country: 'Lithuania', startDate: '2026-11-21', endDate: '2026-11-21' },
  itineraryForDiscover,
);
assert.equal(overlappingAppliedOnly.matchedStatus, null);
assert.deepEqual(overlappingAppliedOnly.clashesWithConfirmed, []);

// Case I: Discover Conference CFP & Stale Row Evaluation
const refToday = '2026-10-09';

// 1) Open with verified future deadline
const cfpOpenFuture = evaluateDiscoverConferenceRow({
  title: 'KubeCon Europe 2027',
  startDate: '2027-03-15',
  endDate: '2027-03-18',
  rawCfpStatus: 'OPEN',
  parsedCfpDeadline: '2026-11-30',
  todayIso: refToday,
});
assert.equal(cfpOpenFuture.skip, false);
assert.equal(cfpOpenFuture.isInProgress, false);
assert.equal(cfpOpenFuture.effectiveCfpStatus, 'OPEN');
assert.equal(cfpOpenFuture.cfpDeadline, '2026-11-30');

// 2) Open in sheet, but deadline is in the past (e.g., JDD Krakow 31-May-2026)
const cfpOpenPastDeadline = evaluateDiscoverConferenceRow({
  title: 'JDD Krakow',
  startDate: '2026-10-20',
  endDate: '2026-10-21',
  rawCfpStatus: 'OPEN',
  parsedCfpDeadline: '2026-05-31',
  todayIso: refToday,
});
assert.equal(cfpOpenPastDeadline.skip, false);
assert.equal(cfpOpenPastDeadline.effectiveCfpStatus, 'CLOSED');

// 3) Open in sheet with blank deadline and future event -> '' (no false CFP OPEN chip)
const cfpBlankFuture = evaluateDiscoverConferenceRow({
  title: 'Web Summit Lisbon',
  startDate: '2026-11-09',
  endDate: '2026-11-12',
  rawCfpStatus: 'OPEN',
  parsedCfpDeadline: '',
  todayIso: refToday,
});
assert.equal(cfpBlankFuture.skip, false);
assert.equal(cfpBlankFuture.isInProgress, false);
assert.equal(cfpBlankFuture.effectiveCfpStatus, '');

// 4) Open in sheet with blank deadline and in-progress event (e.g., World Summit AI 2026-10-07 -> 2026-10-09)
const cfpInProgress = evaluateDiscoverConferenceRow({
  title: 'World Summit AI',
  startDate: '2026-10-07',
  endDate: '2026-10-09',
  rawCfpStatus: 'OPEN',
  parsedCfpDeadline: '',
  todayIso: refToday,
});
assert.equal(cfpInProgress.skip, false);
assert.equal(cfpInProgress.isInProgress, true);
assert.equal(cfpInProgress.effectiveCfpStatus, 'CLOSED');

// 5) Explicitly CLOSED in sheet
const cfpExplicitClosed = evaluateDiscoverConferenceRow({
  title: 'Future Technologies Conference',
  startDate: '2026-10-15',
  endDate: '2026-10-16',
  rawCfpStatus: 'CLOSED',
  parsedCfpDeadline: '2026-05-01',
  todayIso: refToday,
});
assert.equal(cfpExplicitClosed.effectiveCfpStatus, 'CLOSED');

// 6) Stale edition year in title (GOPHERCONAFRICA 2025, Data 2030 Summit 2025, Developer Week '25) -> skipped
assert.equal(
  evaluateDiscoverConferenceRow({
    title: 'GOPHERCONAFRICA 2025',
    startDate: '2026-10-15',
    endDate: '2026-10-17',
    rawCfpStatus: 'OPEN',
    todayIso: refToday,
  }).skipReason,
  'stale-title-year',
);
assert.equal(
  evaluateDiscoverConferenceRow({
    title: 'Data 2030 Summit 2025',
    startDate: '2026-10-20',
    endDate: '2026-10-21',
    rawCfpStatus: 'OPEN',
    todayIso: refToday,
  }).skipReason,
  'stale-title-year',
);
assert.equal(
  evaluateDiscoverConferenceRow({
    title: "Developer Week '25",
    startDate: '2026-10-25',
    endDate: '2026-10-26',
    rawCfpStatus: 'OPEN',
    todayIso: refToday,
  }).skipReason,
  'stale-title-year',
);

// 7) Brand number "2030" in "Data 2030 Summit" is preserved
const data2030 = evaluateDiscoverConferenceRow({
  title: 'Data 2030 Summit',
  startDate: '2026-10-20',
  endDate: '2026-10-21',
  rawCfpStatus: 'OPEN',
  todayIso: refToday,
});
assert.equal(data2030.skip, false);

// 8) Multi-year endDate typo (Africa Tech Summit 2026-02-10 -> 2027-02-11) clamps to startDate and skips as past-event
const multiYearTypo = evaluateDiscoverConferenceRow({
  title: 'Africa Tech Summit',
  startDate: '2026-02-10',
  endDate: '2027-02-11',
  rawCfpStatus: 'OPEN',
  todayIso: refToday,
});
assert.equal(multiYearTypo.skip, true);
assert.equal(multiYearTypo.skipReason, 'past-event');

// Case K: Optional Advocu API Key handling and submit verification
import { submitToAdvocu } from './integrations.ts';
import {
  ASCII_MASKED_ADVOCU_KEY,
  isMaskedAdvocuKey,
  MASKED_ADVOCU_KEY,
  DEFAULT_GDE_PROFILE,
  sanitizeBearerHeaderToken,
} from './policy.ts';
import crypto from 'node:crypto';

const profileWithoutAdvocuKey: GdeProfile = {
  ...DEFAULT_GDE_PROFILE,
  advocuApiKey: '',
  configured: true,
};
const advocuSubmitRes = await submitToAdvocu(baseEvent, profileWithoutAdvocuKey);
assert.equal(advocuSubmitRes.ok, false);
assert.match(advocuSubmitRes.message, /Advocu Personal API Key/);
assert.ok(advocuSubmitRes.payload);

// Case L: Advocu key masking sentinel, ISO-8859-1 header sanitization & AES-256-GCM enc:v2:k1 round-trip
assert.equal(isMaskedAdvocuKey(MASKED_ADVOCU_KEY), true);
assert.equal(isMaskedAdvocuKey(ASCII_MASKED_ADVOCU_KEY), true);
assert.equal(isMaskedAdvocuKey('••••'), true);
assert.equal(isMaskedAdvocuKey('********'), true);
assert.equal(isMaskedAdvocuKey(''), false);
assert.equal(isMaskedAdvocuKey('real-advocu-token-12345'), false);

assert.equal(sanitizeBearerHeaderToken(MASKED_ADVOCU_KEY), '********');
assert.equal(sanitizeBearerHeaderToken('sample_test_token_placeholder_000'), 'sample_test_token_placeholder_000');
assert.equal(sanitizeBearerHeaderToken('\u200Bsample_test_token_placeholder_000\u2022'), 'sample_test_token_placeholder_000');
assert.doesNotThrow(() => {
  new Headers({ Authorization: `Bearer ${sanitizeBearerHeaderToken(MASKED_ADVOCU_KEY)}` });
  new Headers({ Authorization: `Bearer ${sanitizeBearerHeaderToken('sample_test_token_placeholder_000')}` });
});

const testKeyMaterial = crypto.createHash('sha256').update('test-advocu-encryption-secret-v2-k1').digest();
function testEncryptV2K1(plainText: string, key: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v2:k1:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}
function testDecryptV2K1(payload: string, key: Buffer): string {
  assert.equal(payload.startsWith('enc:v2:k1:'), true);
  const [ivB64, tagB64, dataB64] = payload.slice('enc:v2:k1:'.length).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64url')), decipher.final()]);
  return decrypted.toString('utf8');
}

const sampleToken = 'adv_live_9876543210abcdef';
const ct1 = testEncryptV2K1(sampleToken, testKeyMaterial);
const ct2 = testEncryptV2K1(sampleToken, testKeyMaterial);
assert.notEqual(ct1, ct2, 'Random 12-byte IV must produce distinct ciphertexts');
assert.equal(testDecryptV2K1(ct1, testKeyMaterial), sampleToken);
assert.equal(testDecryptV2K1(ct2, testKeyMaterial), sampleToken);

// Tamper detection: flipping a bit in the ciphertext or authTag must throw on decipher.final()
const parts = ct1.split(':');
const tamperedCipherBytes = Buffer.from(parts[5], 'base64url');
tamperedCipherBytes[0] ^= 0xff;
const tamperedPayload = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}:${parts[4]}:${tamperedCipherBytes.toString('base64url')}`;
assert.throws(() => testDecryptV2K1(tamperedPayload, testKeyMaterial), /Unsupported state or unable to authenticate data/);

// Case M: Advocu activity draft payload validation rules (inPersonAttendees only for Hybrid, country only for In-Person/Hybrid, valid write tags)
import { buildAdvocuPayload } from './integrations.ts';

const testAdvocuProfile: GdeProfile = {
  ...DEFAULT_GDE_PROFILE,
  email: 'andresara@gmail.com',
  categories: ['AI', 'Cloud', 'Flutter', 'Go', 'Workspace'],
};

const inPersonPayload = buildAdvocuPayload(
  {
    ...baseEvent,
    title: 'DevFest Mauritius 2026',
    sessionTitle: '',
    city: 'Plaine Wilhems',
    country: 'Mauritius',
    eventFormat: 'In-Person',
    expectedAudience: 200,
    eventUrl: 'https://www.PlaineWilhems.mu',
  },
  testAdvocuProfile,
);
assert.equal('inPersonAttendees' in inPersonPayload, false, 'In-Person events must not include inPersonAttendees');
assert.equal(inPersonPayload.country, 'Mauritius');
assert.deepEqual(inPersonPayload.tags, [
  'AI',
  'Google Cloud',
  'Dart - Flutter',
  'Golang',
  'Google Workspace',
  'DevFest',
]);

const virtualPayload = buildAdvocuPayload(
  {
    ...baseEvent,
    eventFormat: 'Virtual',
    country: 'Online',
  },
  testAdvocuProfile,
);
assert.equal('inPersonAttendees' in virtualPayload, false, 'Virtual events must not include inPersonAttendees');
assert.equal('country' in virtualPayload, false, 'Virtual events must not include country');

const hybridPayload = buildAdvocuPayload(
  {
    ...baseEvent,
    eventFormat: 'Hybrid',
    country: 'Mauritius',
    expectedAudience: 200,
  },
  testAdvocuProfile,
  { attendees: 200, inPersonAttendees: 120 },
);
assert.equal(hybridPayload.inPersonAttendees, 120, 'Hybrid events must include inPersonAttendees');
assert.equal(hybridPayload.country, 'Mauritius');

// Case N: Applied tab includes both Applied and Confirmed / WorkTrips active events
import { isActiveAppliedEvent, isActiveConfirmedEvent } from './policy.ts';

assert.equal(
  isActiveAppliedEvent({ ...baseEvent, status: 'Considering', eventApplied: false, eventApproved: false, worktripsRequested: false, worktripsApproved: false, travelApprovalStatus: 'Not Submitted' }),
  false,
);
assert.equal(
  isActiveAppliedEvent({ ...baseEvent, status: 'Applied', eventApplied: true, eventApproved: false }),
  true,
);
assert.equal(
  isActiveAppliedEvent({ ...baseEvent, status: 'Confirmed', eventApplied: true, eventApproved: true }),
  true,
);
assert.equal(
  isActiveConfirmedEvent({ ...baseEvent, status: 'Confirmed', eventApplied: true, eventApproved: true }),
  true,
);
assert.equal(
  isActiveConfirmedEvent({ ...baseEvent, status: 'Applied', eventApplied: true, eventApproved: false, worktripsRequested: false, worktripsApproved: false, travelApprovalStatus: 'Not Submitted' }),
  false,
);
assert.equal(
  isActiveAppliedEvent({ ...baseEvent, status: 'Completed', eventApplied: true, eventApproved: true }),
  false,
);
assert.equal(
  isActiveAppliedEvent({ ...baseEvent, status: 'Declined', eventApplied: true, eventApproved: false }),
  false,
);

// Case O: GDE Pulse Live Quiz — time limit options (5s, 10s, 15s, 30s, 45s, 60s), comedic name generator & scoring
import {
  calculatePulseAnswerPoints,
  generateComedicParticipantName,
  isValidPulseImageUrl,
  normalizePulseTimeLimit,
  PULSE_TIME_LIMIT_OPTIONS,
} from './policy.ts';

assert.deepEqual([...PULSE_TIME_LIMIT_OPTIONS], [5, 10, 15, 30, 45, 60]);
assert.equal(isValidPulseImageUrl(''), false);
assert.equal(isValidPulseImageUrl('Pro 3.1'), false);
assert.equal(isValidPulseImageUrl('https://gpulse.web.app/gde-banner.jpg'), true);
assert.equal(isValidPulseImageUrl('data:image/jpeg;base64,/9j/4AAQ'), true);
assert.equal(normalizePulseTimeLimit(5), 5);
assert.equal(normalizePulseTimeLimit(10), 10);
assert.equal(normalizePulseTimeLimit(15), 15);
assert.equal(normalizePulseTimeLimit(30), 30);
assert.equal(normalizePulseTimeLimit(45), 45);
assert.equal(normalizePulseTimeLimit(60), 60);
assert.equal(normalizePulseTimeLimit(999), 15);

const comedic1 = generateComedicParticipantName(42);
assert.ok(comedic1.length >= 5 && comedic1.includes('#'), 'Comedic name must be non-empty with tag');
assert.equal(calculatePulseAnswerPoints(false, 1000, 15), 0);
assert.equal(calculatePulseAnswerPoints(true, 0, 15), 1000);
assert.ok(calculatePulseAnswerPoints(true, 7500, 15) >= 700);
assert.equal(calculatePulseAnswerPoints(true, 20000, 15), 0);
assert.equal(DEFAULT_ANDRES_PROFILE.travelPlannerEnabled, true);

// Case P: Advocu OpenCFP snapshot & URL external link resolution
import fs from 'node:fs';
const advocuSnap = JSON.parse(
  fs.readFileSync(new URL('../functions/advocu_opencfp_snapshot.json', import.meta.url), 'utf8'),
);
assert.ok(Array.isArray(advocuSnap) && advocuSnap.length >= 100, 'Advocu OpenCFP snapshot must contain >100 events');
const warsawSnap = advocuSnap.find((e: { id: string }) => e.id === '6a9e63804f57bc69c8b411c1');
assert.ok(warsawSnap, 'Warsaw DevFest must exist in Advocu OpenCFP snapshot');
assert.equal(warsawSnap.title, 'GDG DevFest 2026 Warsaw');
assert.ok(
  String(warsawSnap.externalUrl).includes('gdg.community.dev/events/details/'),
  'Warsaw DevFest must resolve external Bevy event URL from Advocu API',
);

// Case Q: GDE Deck Studio distinct OpenXML template architectures & zero legacy template references
import { compileOpenXmlPptx, BRAND_PRESETS, type PresentationDeckSpec } from './pptxOpenXml.ts';

const presetStyles = BRAND_PRESETS.map((theme) => theme.templateStyle);
assert.deepEqual(
  presetStyles,
  ['gde-2026-navy', 'gde-2026-light-pills', 'cloud-blueprint', 'devfest-split', 'build-with-ai-terminal'],
  'All 5 distinct slide template presets must be registered',
);

const compiledSizes = new Set<number>();
for (const brand of BRAND_PRESETS) {
  const spec: PresentationDeckSpec = {
    productName: 'GDE Deck Studio',
    deckTitle: `Test Deck ${brand.id}`,
    deckSubtitle: 'OpenXML Template Verification',
    presenterName: 'Andre Sara',
    gdeCategory: 'Cloud & AI',
    brand,
    slides: [
      {
        id: 'slide-1',
        sectionTag: '01 // OVERVIEW',
        title: 'Distinct Slide Architecture Check',
        subtitle: 'OpenXML Template Verification',
        layout: 'editorial-split',
        cards: [
          { badge: '01', heading: 'First Point', bullets: ['Detail A', 'Detail B'], metric: '86%' },
          { badge: '02', heading: 'Second Point', bullets: ['Detail C', 'Detail D'], metric: '14%' },
          { badge: '03', heading: 'Third Point', bullets: ['Detail E', 'Detail F'], metric: '99%' },
        ],
        visualPrompt: 'Technical diagram',
        takeaway: 'Bottom summary line',
        speakerNotes: 'Speaker notes for slide 1.',
      },
    ],
  };
  const bytes = compileOpenXmlPptx(spec);
  assert.equal(bytes[0], 0x50, 'PPTX must start with PK zip signature (P)');
  assert.equal(bytes[1], 0x4b, 'PPTX must start with PK zip signature (K)');
  const rawAscii = new TextDecoder('latin1').decode(bytes);
  assert.ok(!rawAscii.includes('PILLAR 01'), `Template ${brand.id} must not render legacy PILLAR 01 white boxes`);
  assert.ok(!rawAscii.includes('KEY TAKEAWAY //'), `Template ${brand.id} must not render legacy KEY TAKEAWAY // banner`);
  compiledSizes.add(bytes.byteLength);
}
assert.equal(compiledSizes.size, 5, 'Each of the 5 templates must compile a structurally distinct OpenXML slide geometry');

// Case R: End-to-End Sample Deck (2026 GDE Brand Guide) Conversion, Keep Existing Brand, & Add New Slide Regression Tests
import { parseUploadedPptxFile } from './pptxOpenXml.ts';
import {
  KEEP_EXISTING_BRAND_ID,
  applyDefaultSampleDeckToStudioState,
  applyUploadedPptxDeckToStudioState,
  buildKeepExistingBrandSpec,
  convertParsedPptxToBrandDeck,
  detectMarkdownSlideCount,
  formatGeneratingTimerLabel,
  formatSlideBodyTextFromCards,
  getDeckStudioStateSnapshot,
  insertNewSlideAfterIndex,
  mergeSlidePairsInDeck,
  parseMarkdownIntoSlides,
  parseMergePairsText,
  parseSlideBodyTextIntoCards,
  removeSlidesByIndicesInDeck,
  resolveGoogleDriveSlideTabUrl,
} from './deckStudio.ts';

// Verify initial un-uploaded Deck Studio state (no preloaded 24 slides before upload; default Keep Existing Deck Template)
const initialSnap = getDeckStudioStateSnapshot();
assert.equal(initialSnap.sourceUploaded, false, 'Deck Studio must not mark a deck uploaded before user action');
assert.equal(initialSnap.slideCount, 2, 'Initial Deck Studio state must start with 2 starter slides, not 24 preloaded slides');
assert.equal(initialSnap.targetSlideCount, 2, 'Initial Target Slide Count must match the 2 starter slides before upload');
assert.equal(initialSnap.brandId, KEEP_EXISTING_BRAND_ID, 'Default Step 2 brand preset must be keep-existing-brand');
assert.equal(initialSnap.brandName, 'Keep Existing Deck Template', 'Default Step 2 brand preset label must be Keep Existing Deck Template');

// Preloaded sample deck: 2026 GDE Brand Guide (Keep Existing Deck Template, slide count matches the deck)
const sampleDeckUrl = new URL('../2026-GDE-Brand-Guide-Distilled.pptx', import.meta.url);
if (fs.existsSync(sampleDeckUrl)) {
  const sampleBuf = fs.readFileSync(sampleDeckUrl);
  const sampleFile = new File([sampleBuf], '2026-GDE-Brand-Guide-Distilled.pptx', {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  });
  const parsedSample = await parseUploadedPptxFile(sampleFile);
  const sampleSlideCount = parsedSample.extractedSlides.length;
  assert.ok(sampleSlideCount >= 1, 'Must extract slides from the 2026 GDE Brand Guide sample deck');

  // Verify the preloaded sample uses Keep Existing Deck Template, matches the deck's slide count, and is labelled as a sample
  const sampleResult = applyDefaultSampleDeckToStudioState(parsedSample);
  assert.equal(sampleResult.slideCount, sampleSlideCount, 'Preloaded sample must keep every slide of the Brand Guide deck');
  assert.equal(sampleResult.brand.id, KEEP_EXISTING_BRAND_ID, 'Preloaded sample must use Keep Existing Deck Template');
  const sampleSnap = getDeckStudioStateSnapshot();
  assert.equal(sampleSnap.isSampleDeck, true, 'Preloaded sample deck must be labelled as a sample, not a user upload');
  assert.equal(sampleSnap.sourceUploaded, false, 'Preloaded sample deck must keep sourceUploaded=false so it never masquerades as a user upload');
  assert.equal(sampleSnap.targetSlideCount, sampleSlideCount, 'Target Slide Count must match the sample deck');

  // Verify a user upload replaces the sample, keeps Keep Existing Deck Template, and matches the uploaded slide count
  const uploadedStateResult = applyUploadedPptxDeckToStudioState(parsedSample);
  assert.equal(uploadedStateResult.slideCount, sampleSlideCount, 'Uploading a PPTX must set slideCount to the deck slide count');
  assert.equal(uploadedStateResult.brand.id, KEEP_EXISTING_BRAND_ID, 'Uploading a PPTX must keep Keep Existing Deck Template');
  const afterUploadSnap = getDeckStudioStateSnapshot();
  assert.equal(afterUploadSnap.isSampleDeck, false, 'A user upload must no longer be labelled as the sample deck');
  assert.equal(afterUploadSnap.slideCount, sampleSlideCount, 'Studio state must hold every uploaded slide');
  assert.equal(afterUploadSnap.targetSlideCount, sampleSlideCount, 'Target Slide Count must match the uploaded deck');
  assert.equal(afterUploadSnap.brandId, KEEP_EXISTING_BRAND_ID, 'Studio state brandId must remain keep-existing-brand after upload');

  // Target Slide Count must default to the uploaded deck's own slide count (24, 38, ...), with no upper limit
  for (const uploadedCount of [24, 38]) {
    const largerDeck = {
      ...parsedSample,
      fileName: `Talk-${uploadedCount}.pptx`,
      extractedSlides: Array.from({ length: uploadedCount }, (_, i) => ({
        ...structuredClone(parsedSample.extractedSlides[i % sampleSlideCount]),
        title: `Uploaded Slide ${i + 1}`,
      })),
    };
    const largerResult = applyUploadedPptxDeckToStudioState(largerDeck);
    assert.equal(largerResult.slideCount, uploadedCount, `Uploading a ${uploadedCount}-slide deck must load all ${uploadedCount} slides`);
    assert.equal(largerResult.brand.id, KEEP_EXISTING_BRAND_ID, `Uploading a ${uploadedCount}-slide deck must use Keep Existing Deck Template`);
    const largerSnap = getDeckStudioStateSnapshot();
    assert.equal(largerSnap.slideCount, uploadedCount, `Studio state must hold all ${uploadedCount} uploaded slides`);
    assert.equal(largerSnap.targetSlideCount, uploadedCount, `Target Slide Count must default to ${uploadedCount} for a ${uploadedCount}-slide deck`);
    assert.equal(largerSnap.pendingTargetSlideCount, uploadedCount, `Pending Target Slide Count must default to ${uploadedCount}`);
  }

  assert.equal(detectMarkdownSlideCount('## Slide A\n## Slide B\n## Slide C', 2), 3);

  // Verify 24-slide markdown / Slide N outline is never cropped to 2 even if fallback/targetCount is 2
  const md24H2 = Array.from({ length: 24 }, (_, i) => `## Slide ${i + 1}: Topic ${i + 1}\n- Bullet A${i + 1}\n- Bullet B${i + 1}`).join('\n\n');
  assert.equal(detectMarkdownSlideCount(md24H2, 2), 24, 'detectMarkdownSlideCount must detect all 24 H2 slides');
  const parsedMd24 = parseMarkdownIntoSlides(md24H2, 2, BRAND_PRESETS[0]);
  assert.equal(parsedMd24.length, 24, 'parseMarkdownIntoSlides must preserve all 24 slides and never crop to 2');

  const md24SlideLabels = Array.from({ length: 24 }, (_, i) => `Slide ${i + 1}: Keynote Section ${i + 1}\n- Point ${i + 1}`).join('\n\n');
  assert.equal(detectMarkdownSlideCount(md24SlideLabels, 2), 24, 'detectMarkdownSlideCount must detect all 24 Slide N labels');
  const parsedLabels24 = parseMarkdownIntoSlides(md24SlideLabels, 2, BRAND_PRESETS[0]);
  assert.equal(parsedLabels24.length, 24, 'parseMarkdownIntoSlides must parse all 24 Slide N blocks without cropping');

  // Verify table-only slides (<a:tbl> with empty <p:sp>) and grouped shapes (<p:grpSp>) parse cleanly without throwing
  const rogueAiDeckUrl = new URL('../../Editor/Rogue AI.pptx', import.meta.url);
  if (fs.existsSync(rogueAiDeckUrl)) {
    const rogueBuf = fs.readFileSync(rogueAiDeckUrl);
    const rogueFile = new File([rogueBuf], 'Rogue AI.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const parsedRogue = await parseUploadedPptxFile(rogueFile);
    assert.equal(parsedRogue.extractedSlides.length, 19, 'Deck with table-only and grouped-shape slides must scan all 19 slides without crashing');
  }

  // Verify HeaderBox + PillarCard_1..3 slides preserve HeaderBox title/subtitle instead of PillarCard_1 metric
  const veggieDistilledPath = '/Users/andresara/Downloads/Veggie-Hero-Brand-Guide-Distilled.pptx';
  if (fs.existsSync(veggieDistilledPath)) {
    const veggieBuf = fs.readFileSync(veggieDistilledPath);
    const veggieFile = new File([veggieBuf], 'Veggie-Hero-Brand-Guide-Distilled.pptx', {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
    const parsedVeggie = await parseUploadedPptxFile(veggieFile);
    assert.equal(
      parsedVeggie.extractedSlides[0].title,
      'Making Veggie Hero a Self-Funding National Movement',
      'HeaderBox must win over PillarCard_1 metric as the slide title',
    );
    assert.equal(
      parsedVeggie.extractedSlides[0].bullets.length,
      3,
      'Three PillarCard shapes must map to 3 structured card bullets without footer/header noise',
    );
  }

  const gdeBrand = { ...BRAND_PRESETS[0] };
  const convertedSlides = convertParsedPptxToBrandDeck(parsedSample, gdeBrand);
  assert.equal(convertedSlides.length, sampleSlideCount, 'Must preserve every slide when converting to 2026 GDE Brand Guide');
  assert.ok(convertedSlides.every((s) => s.title.trim().length > 0), 'Every converted sample slide must keep a title');
  assert.ok(convertedSlides[0].cards.length > 0, 'Slide 1 body text must populate cards');

  // Verify Keep Existing Deck Template option
  const keepExistingBrand = buildKeepExistingBrandSpec(parsedSample, gdeBrand);
  assert.equal(keepExistingBrand.id, KEEP_EXISTING_BRAND_ID, 'Keep Existing Brand preset must have id keep-existing-brand');
  assert.equal(keepExistingBrand.name, 'Keep Existing Deck Template', 'Brand preset name must be Keep Existing Deck Template');
  assert.equal(keepExistingBrand.templateStyle, 'keep-original', 'Keep Existing Deck Template must use keep-original templateStyle');

  // Verify Slide Body Text formatting and editing round-trip
  const firstCard = convertedSlides[0].cards[0];
  const firstCardText = firstCard.heading || firstCard.bullets[0] || '';
  const slide1Body = formatSlideBodyTextFromCards(convertedSlides[0]);
  assert.ok(slide1Body.includes(firstCardText), 'Formatted slide body text must include slide content');
  const updatedCards = parseSlideBodyTextIntoCards('Custom Point 1: Updated detail\nCustom Point 2: Second detail', convertedSlides[0].cards);
  assert.equal(updatedCards.length, 2, 'Edited slide body text must parse into 2 cards');
  assert.equal(updatedCards[0].heading, 'Custom Point 1');
  assert.equal(updatedCards[0].bullets[0], 'Updated detail');

  // Verify Merge Pairs parser ("Slide 1 and 5, Slide 10 and 12") and Merge / Remove deck helpers on a 24-slide deck
  const longDeck = Array.from({ length: 24 }, (_, i) => ({
    ...structuredClone(convertedSlides[i % convertedSlides.length]),
    id: `slide-${i + 1}`,
    sourceSlideNumber: i + 1,
    title: `Sample Slide ${i + 1}`,
  }));
  const parsedPairs = parseMergePairsText('Slide 1 and 5, Slide 10 and 12', 24);
  assert.deepEqual(parsedPairs, [
    { firstSlideNumber: 1, secondSlideNumber: 5 },
    { firstSlideNumber: 10, secondSlideNumber: 12 },
  ]);
  const mergedResult = mergeSlidePairsInDeck(longDeck, parsedPairs);
  assert.equal(mergedResult.slides.length, 22, 'Merging 2 pairs (Slide 1&5, Slide 10&12) in a 24-slide deck must yield 22 slides');
  assert.deepEqual(mergedResult.mergedDescriptions, ['Slide 1 + Slide 5', 'Slide 10 + Slide 12']);
  assert.ok(mergedResult.slides[0].mergedFromSlideNumbers?.includes(5), 'Slide 1 must record mergedFromSlideNumbers [5]');

  const removedResult = removeSlidesByIndicesInDeck(longDeck, [1, 3]);
  assert.equal(removedResult.slides.length, 22, 'Removing 2 slides from a 24-slide deck must yield 22 slides');
  assert.deepEqual(removedResult.removedSlideNumbers, [2, 4]);

  // Verify Google Drive Upload Step 2 slide tab URL resolution
  assert.equal(
    resolveGoogleDriveSlideTabUrl({ id: '1AbC_SlideDeckId123', webViewLink: 'https://drive.google.com/file/d/1AbC_SlideDeckId123/view' }),
    'https://docs.google.com/presentation/d/1AbC_SlideDeckId123/edit',
    'Uploaded Google Drive presentation must resolve to docs.google.com/presentation/d/{id}/edit for new tab slide view',
  );

  // Verify Generating button seconds timer label formatting
  assert.equal(
    formatGeneratingTimerLabel('GENERATING DECK...', 0),
    '⏳ GENERATING DECK... (0s)',
  );
  assert.equal(
    formatGeneratingTimerLabel('Generating Photo with gemini-nano-banana-2.1...', 4),
    '⏳ Generating Photo with gemini-nano-banana-2.1... (4s)',
  );

  // Verify Courier Code Snippet insertion in Keep Existing Deck Template OpenXML export
  const slidesWithCode = convertedSlides.map((s, idx) =>
    idx === 0 ? { ...s, codeSnippet: 'const agent = new Agent({ model: "gemini-4-argon" });' } : s,
  );
  const keepOriginalOut = compileOpenXmlPptx({
    productName: 'GDE Deck Studio',
    deckTitle: convertedSlides[0].title,
    deckSubtitle: keepExistingBrand.name,
    presenterName: 'Andre Sara',
    gdeCategory: 'Cloud & AI GDE',
    brand: keepExistingBrand,
    slides: slidesWithCode,
    sourceZipEntries: parsedSample.rawZipEntries,
  });
  const keepOriginalAscii = new TextDecoder('latin1').decode(keepOriginalOut);
  assert.ok(keepOriginalAscii.includes('Courier New'), 'Compiled PPTX with codeSnippet must render code in Courier New font');
  assert.ok(keepOriginalAscii.includes('const agent = new Agent'), 'Compiled PPTX must contain the pasted code snippet text');

  // Verify Add New Slide inserts immediately after current slide
  const afterSlide1 = insertNewSlideAfterIndex(convertedSlides, 0, gdeBrand);
  assert.equal(afterSlide1.insertedIndex, 1, 'Adding new slide on Slide 1 (idx 0) must insert at idx 1 (Slide 2)');
  assert.equal(afterSlide1.slides.length, sampleSlideCount + 1, 'Deck length must increase by one');
  assert.equal(afterSlide1.slides[0].title, convertedSlides[0].title, 'Original Slide 1 must remain at idx 0');
  assert.equal(afterSlide1.slides[1].title, 'New Slide 2', 'Newly inserted slide must be at idx 1');

  const compiledOut = compileOpenXmlPptx({
    productName: 'GDE Deck Studio',
    deckTitle: convertedSlides[0].title,
    deckSubtitle: gdeBrand.name,
    presenterName: 'Andre Sara',
    gdeCategory: 'Cloud & AI GDE',
    brand: gdeBrand,
    slides: convertedSlides,
  });
  const compiledAscii = new TextDecoder('latin1').decode(compiledOut);
  assert.ok(!compiledAscii.includes('&lt;a:'), 'Compiled PPTX must contain zero leaked XML tags');
  assert.ok(compiledAscii.includes('20344B'), 'Compiled PPTX must apply #20344B Grounding Navy');
  assert.ok(compiledAscii.includes('FF7DAF'), 'Compiled PPTX must apply #FF7DAF Halftone Pink');
}

console.log('✅ All GDE Pulse live quiz, modular Travel Planner, WorkTrips checklist, $600/$800/$1,200 budget, overlap, Advocu My Events parser, Advocu OpenCFP feed & URL resolution, Speaker Matching session suggestions, Schema-Locked SQL/Agent engine, Discover region & clash filter, ±21-day reimbursement, and 5 distinct OpenXML Deck Studio template checks passed!');
