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
Democratising AI: Ethical and Responsible Development
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
assert.equal(speakerSessions.includes('Democratising AI: Ethical and Responsible Development'), true);
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
assert.equal(isValidPulseImageUrl('https://gpulse.web.app/gde-hero.jpg'), true);
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

console.log('✅ All GDE Pulse live quiz, modular Travel Planner, WorkTrips checklist, $600/$800/$1,200 budget, overlap, Advocu My Events parser, Speaker Matching session suggestions, Schema-Locked SQL/Agent engine, Discover region & clash filter, and ±21-day reimbursement checks passed!');
