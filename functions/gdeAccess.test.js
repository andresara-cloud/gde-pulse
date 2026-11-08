'use strict';

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MATCH_THRESHOLD,
  buildAccessRequestEmail,
  buildDecisionUrl,
  isAllowedStatus,
  matchGdeByName,
  stringSimilarity,
  verifyDecision,
} = require('./gdeAccess');

// Directory records mirror me.developers.google.com: p[1] display name, p[11] location, p[17] handle
const expert = (name, handle, location = '') => [
  [
    `profiles/${handle || name}`,
    name,
    '',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    [null, null, 'XX', location],
    null,
    null,
    null,
    null,
    null,
    handle,
  ],
];
const DIRECTORY = [
  expert('Andre', 'AndreSara', 'Frankfurt am Main, Germany'),
  expert('Sashikumar Yadav (Sky)', 'sky'),
  expert('José Pérez', 'jperez'),
  expert('Thomas', 'tom'),
  expert('Yixin Zhang (张益新)', 'yixin'),
];

test('matches the directory handle when the display name is a single word (Andre / AndreSara)', () => {
  const match = matchGdeByName(DIRECTORY, 'Andre Sara');
  assert.equal(match?.matchedOn, 'handle');
  assert.ok(match?.similarity >= MATCH_THRESHOLD);
  assert.equal(match?.profile.profileUrl, 'https://me.developers.google.com/u/AndreSara');
  assert.equal(match?.profile.location, 'Frankfurt am Main, Germany');
});

test('matches on >= 90% similarity across name and email against the GDE directory', () => {
  assert.equal(MATCH_THRESHOLD, 0.9);
  assert.ok(stringSimilarity('sashikumaryadav', 'sashikumaryadaf') >= 0.9);
  // 93.8% fuzzy name match (>= 90%) succeeds
  const fuzzy = matchGdeByName(DIRECTORY, 'Sashikumar Yadaf');
  assert.equal(fuzzy?.matchedOn, 'name');
  assert.ok(fuzzy?.similarity >= 0.9);
  // Email match on handle when profile name is single word
  const emailMatch = matchGdeByName(DIRECTORY, 'Andre', 'contact@andresara.io');
  assert.equal(emailMatch?.matchedOn, 'email');
  assert.equal(emailMatch?.similarity, 1);
});

test('ignores bracketed nicknames, accents, case and word order', () => {
  assert.equal(matchGdeByName(DIRECTORY, 'Sashikumar Yadav')?.matchedOn, 'name');
  assert.equal(matchGdeByName(DIRECTORY, 'jose perez')?.matchedOn, 'name');
  assert.equal(matchGdeByName(DIRECTORY, 'Zhang Yixin')?.matchedOn, 'name');
});

test('does not match single first names or < 90% non-GDEs', () => {
  assert.equal(matchGdeByName(DIRECTORY, 'Andre'), null);
  assert.equal(matchGdeByName(DIRECTORY, 'Thomas'), null);
  assert.equal(matchGdeByName(DIRECTORY, 'Jane Doe'), null);
  assert.equal(matchGdeByName(DIRECTORY, ''), null);
  assert.equal(matchGdeByName([], 'Andre Sara'), null);
});

test('only validated and approved statuses grant access', () => {
  assert.equal(isAllowedStatus('validated'), true);
  assert.equal(isAllowedStatus('approved'), true);
  for (const s of ['unverified', 'pending', 'blocked', '', null, undefined]) {
    assert.equal(isAllowedStatus(s), false);
  }
});

test('decision links verify both allow/approve and block, and reject tampering, wrong keys and expiry', () => {
  const key = 'test-signing-key';
  const now = Date.parse('2026-11-08T10:00:00Z');
  const url = new URL(buildDecisionUrl(key, 'uid123', 'allow', now));
  const params = Object.fromEntries(url.searchParams);
  assert.equal(url.pathname, '/api/access/decide');
  assert.equal(verifyDecision(key, params, now), true);
  assert.equal(verifyDecision(key, { ...params, action: 'allow' }, now), true);
  assert.equal(verifyDecision(key, { ...params, action: 'block' }, now), false);
  assert.equal(verifyDecision(key, { ...params, uid: 'someoneElse' }, now), false);
  assert.equal(verifyDecision('wrong-key', params, now), false);
  assert.equal(verifyDecision(key, params, now + 8 * 24 * 60 * 60 * 1000), false);
  assert.equal(verifyDecision('', params, now), false);
});

test('request email escapes user-controlled names, drops non-https profile links, and includes Allow/Block buttons', () => {
  const mail = buildAccessRequestEmail({
    record: {
      displayName: '<img src=x onerror=alert(1)>',
      email: 'jane@example.com',
      profileLink: 'javascript:alert(1)',
    },
    approveUrl: 'https://gde.web.app/api/access/decide?a=1',
    blockUrl: 'https://gde.web.app/api/access/decide?a=2',
  });
  assert.ok(!mail.html.includes('<img src=x'));
  assert.ok(mail.html.includes('&lt;img src=x'));
  assert.ok(!mail.html.includes('javascript:'));
  assert.ok(mail.html.includes('Not provided'));
  assert.ok(mail.html.includes('>Allow<'));
  assert.ok(mail.html.includes('>Block<'));
});

test('admin email address is obfuscated in tracked source files', () => {
  const src = fs.readFileSync(path.join(__dirname, 'gdeAccess.js'), 'utf8');
  const obfuscatedTarget = Buffer.from('YW5kcmVAYW5kcmVzYXJhLmlv', 'base64').toString('utf8');
  assert.ok(!src.includes(obfuscatedTarget), 'Plaintext admin email must not appear in gdeAccess.js');
});
