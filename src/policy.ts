export type GdeRegion =
  | 'Europe'
  | 'MENAT'
  | 'SSA'
  | 'NA'
  | 'LATAM'
  | 'APAC'
  | 'India';

export type GdeCategory =
  | 'AI'
  | 'Cloud'
  | 'Firebase'
  | 'Android'
  | 'Web'
  | 'Flutter'
  | 'Angular'
  | 'Go'
  | 'Workspace';

export type EventCampaign =
  | 'DevFest'
  | 'Build with AI'
  | 'I/O Extended'
  | 'GDG'
  | '3rd-Party';

export type EventStatus =
  | 'Considering'
  | 'Applied'
  | 'Confirmed'
  | 'Declined'
  | 'Completed';

export type CfpPlatform =
  | 'Advocu'
  | 'Sessionize'
  | 'Google Forms'
  | 'Bevy / GDG'
  | 'Other';

export type ActivityType = 'Talk' | 'Workshop' | 'Panel';

export type BookingMode = 'WorkTrips Direct' | 'Reimbursement' | 'None';

export type TravelApprovalStatus =
  | 'Not Needed'
  | 'Not Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected';

export interface EventPhoto {
  id: string;
  name: string;
  dataUrl: string;
  caption: string;
  addedAt: string;
}

export interface GdeProfile {
  email: string;
  sessionizeEmail: string;
  displayName: string;
  homeCountry: string;
  homeRegion: GdeRegion;
  currentCountry: string;
  currentRegion: GdeRegion;
  categories: GdeCategory[];
  advocuApiKey: string;
  sessionizeSpeakerId: string;
  preferredCurrency: string;
  avatarUrl?: string;
  organization?: string;
  bio?: string;
  location?: string;
  gdeProfileUrl?: string;
  specializations?: string[];
  agentTokenHash?: string;
  travelPlannerEnabled?: boolean;
  configured?: boolean;
  updatedAt: string;
}

export type PulseTimeLimitSec = 5 | 10 | 15 | 30 | 45 | 60;

export const PULSE_TIME_LIMIT_OPTIONS: readonly PulseTimeLimitSec[] = [5, 10, 15, 30, 45, 60];

export interface PulseQuestion {
  id: string;
  prompt: string;
  imageUrl?: string;
  options: string[];
  correctIndex: number;
  timeLimitSec: PulseTimeLimitSec;
}

export type PulseQuizStatus = 'draft' | 'lobby' | 'question' | 'reveal' | 'completed';

export interface PulseQuiz {
  id: string;
  ownerUid: string;
  ownerName?: string;
  title: string;
  code: string;
  status: PulseQuizStatus;
  isActive?: boolean;
  currentQuestionIndex: number;
  questionStartedAt?: number;
  questions: PulseQuestion[];
  createdAt?: string;
  updatedAt: string;
}

export interface PulseAnswerRecord {
  selectedIndex: number;
  answeredAtMs: number;
  points: number;
  correct: boolean;
}

export interface PulseParticipant {
  uid: string;
  name: string;
  score: number;
  correctCount: number;
  answers?: Record<string, PulseAnswerRecord>;
  lastAnsweredIndex?: number;
  lastSelectedIndex?: number;
  joinedAt?: string;
  updatedAt?: string;
}

const COMEDIC_ADJECTIVES = [
  'Caffeinated',
  'Sudo',
  'Quantum',
  'Segfault',
  'Serverless',
  'Hallucinating',
  'Overclocked',
  'Unclosed',
  'GitPushForce',
  'ZeroLatency',
  'AsyncAwait',
  '404Brain',
  'FloatingPoint',
  'HotReload',
  'MergeConflict',
  'Dockerized',
  'NullPointer',
  'TokenLimit',
  'PromptInjected',
  'InfiniteLoop',
];

const COMEDIC_NOUNS = [
  'Capybara',
  'Quokka',
  'Squirrel',
  'Llama',
  'Badger',
  'Yeti',
  'Platypus',
  'Mango',
  'Hippo',
  'Panda',
  'Sloth',
  'Toucan',
  'Raccoon',
  'RubberDuck',
  'Ferret',
  'Narwhal',
  'Goblin',
  'Waffle',
  'Wombat',
  'Axolotl',
];

export function generateComedicParticipantName(seed?: number): string {
  const r1 =
    seed !== undefined
      ? Math.abs(Math.floor(seed)) % COMEDIC_ADJECTIVES.length
      : Math.floor(Math.random() * COMEDIC_ADJECTIVES.length);
  const r2 =
    seed !== undefined
      ? Math.abs(Math.floor(seed / 7 + 3)) % COMEDIC_NOUNS.length
      : Math.floor(Math.random() * COMEDIC_NOUNS.length);
  const tag =
    seed !== undefined
      ? (Math.abs(Math.floor(seed)) % 89) + 10
      : Math.floor(10 + Math.random() * 89);
  return `${COMEDIC_ADJECTIVES[r1]} ${COMEDIC_NOUNS[r2]} #${tag}`;
}

export function normalizePulseTimeLimit(sec: unknown): PulseTimeLimitSec {
  const num = Number(sec);
  return (PULSE_TIME_LIMIT_OPTIONS as readonly number[]).includes(num)
    ? (num as PulseTimeLimitSec)
    : 15;
}

export function isValidPulseImageUrl(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  return (
    /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(trimmed) ||
    /^https?:\/\/\S+\.\S+/i.test(trimmed)
  );
}

export function calculatePulseAnswerPoints(
  isCorrect: boolean,
  elapsedMs: number,
  timeLimitSec: PulseTimeLimitSec,
): number {
  if (!isCorrect) return 0;
  const totalMs = Math.max(1000, timeLimitSec * 1000);
  if (elapsedMs > totalMs + 1500) return 0; // Grace buffer of 1.5s for network latency
  const clampedElapsed = Math.max(0, Math.min(totalMs, elapsedMs));
  const speedRatio = 1 - clampedElapsed / totalMs;
  return 500 + Math.round(500 * speedRatio);
}

export interface GdeEvent {
  id: string;
  title: string;
  campaign: EventCampaign;
  city: string;
  country: string;
  region: GdeRegion;
  departureCountry?: string;
  departureRegion?: GdeRegion;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: EventStatus;
  cfpPlatform: CfpPlatform;
  cfpUrl: string;
  eventUrl: string;
  sessionTitle: string;
  activityType: ActivityType;
  eventFormat: 'In-Person' | 'Hybrid' | 'Virtual';
  expectedAudience: number;
  isGdgOnCampus: boolean;
  budgetUsd: number; // 600 | 800 | 1200 | 0
  // Simplified Event & WorkTrips checklist
  eventApplied?: boolean;
  eventApproved?: boolean;
  worktripsRequested?: boolean;
  worktripsApproved?: boolean;
  worktripsTravelRequested?: boolean;
  worktripsTravelApproved?: boolean;
  budgetApproved?: boolean;
  // Legacy / Firestore-compatible fields
  bookingMode: BookingMode;
  travelApprovalStatus: TravelApprovalStatus;
  flightBooked: boolean;
  hotelBooked: boolean;
  worktripsRef: string;
  reimbursementSubmitted: boolean;
  reimbursementSubmittedDate: string;
  reimbursementAmountUsd: number;
  advocuSynced: boolean;
  photos?: EventPhoto[];
  notes: string;
  updatedAt: string;
}

export const MASKED_ADVOCU_KEY = '••••••••';
export const ASCII_MASKED_ADVOCU_KEY = '********';

export function isMaskedAdvocuKey(val: unknown): boolean {
  const s = String(val || '').trim();
  return s === MASKED_ADVOCU_KEY || s === ASCII_MASKED_ADVOCU_KEY || /^[•*]+$/.test(s);
}

/**
 * Ensures any token placed inside an HTTP Authorization header is strictly
 * printable ASCII (0x21..0x7E) so window.fetch() never throws
 * "String contains non ISO-8859-1 code point" on masked bullets (•) or
 * invisible copy-paste Unicode characters.
 */
export function sanitizeBearerHeaderToken(val: unknown): string {
  const s = String(val || '').trim();
  if (!s) return '';
  if (isMaskedAdvocuKey(s)) return ASCII_MASKED_ADVOCU_KEY;
  return s.replace(/[^\x21-\x7E]/g, '');
}

export const DEFAULT_GDE_PROFILE: GdeProfile = {
  email: '',
  sessionizeEmail: '',
  displayName: '',
  homeCountry: '',
  homeRegion: 'Europe',
  currentCountry: '',
  currentRegion: 'Europe',
  categories: [],
  advocuApiKey: '',
  sessionizeSpeakerId: '',
  preferredCurrency: 'USD',
  travelPlannerEnabled: true,
  configured: false,
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_ANDRES_PROFILE: GdeProfile = DEFAULT_GDE_PROFILE;

const COUNTRY_TO_REGION: Record<string, GdeRegion> = {
  // Europe (including Caucasus)
  germany: 'Europe', de: 'Europe',
  uk: 'Europe', gb: 'Europe', 'united kingdom': 'Europe', 'great britain': 'Europe',
  france: 'Europe', fr: 'Europe',
  spain: 'Europe', es: 'Europe',
  italy: 'Europe', it: 'Europe',
  netherlands: 'Europe', nl: 'Europe', 'the netherlands': 'Europe',
  poland: 'Europe', pl: 'Europe',
  switzerland: 'Europe', ch: 'Europe',
  austria: 'Europe', at: 'Europe',
  sweden: 'Europe', se: 'Europe',
  portugal: 'Europe', pt: 'Europe',
  belgium: 'Europe', be: 'Europe',
  ireland: 'Europe', ie: 'Europe',
  czechia: 'Europe', cz: 'Europe', 'czech republic': 'Europe',
  greece: 'Europe', gr: 'Europe',
  romania: 'Europe', ro: 'Europe',
  denmark: 'Europe', dk: 'Europe',
  finland: 'Europe', fi: 'Europe',
  norway: 'Europe', no: 'Europe',
  hungary: 'Europe', hu: 'Europe',
  slovakia: 'Europe', sk: 'Europe',
  slovenia: 'Europe', si: 'Europe',
  croatia: 'Europe', hr: 'Europe',
  serbia: 'Europe', rs: 'Europe',
  bulgaria: 'Europe', bg: 'Europe',
  estonia: 'Europe', ee: 'Europe',
  latvia: 'Europe', lv: 'Europe',
  lithuania: 'Europe', lt: 'Europe',
  luxembourg: 'Europe', lu: 'Europe',
  iceland: 'Europe', is: 'Europe',
  malta: 'Europe', mt: 'Europe',
  cyprus: 'Europe', cy: 'Europe',
  ukraine: 'Europe', ua: 'Europe',
  moldova: 'Europe', md: 'Europe',
  albania: 'Europe', al: 'Europe',
  kosovo: 'Europe', xk: 'Europe',
  'north macedonia': 'Europe', mk: 'Europe', macedonia: 'Europe',
  'bosnia and herzegovina': 'Europe', ba: 'Europe', bosnia: 'Europe',
  montenegro: 'Europe', me: 'Europe',
  andorra: 'Europe', ad: 'Europe',
  monaco: 'Europe', mc: 'Europe',
  liechtenstein: 'Europe', li: 'Europe',
  georgia: 'Europe', ge: 'Europe',
  armenia: 'Europe', am: 'Europe',
  azerbaijan: 'Europe', az: 'Europe',
  belarus: 'Europe', by: 'Europe',

  // North America (NA)
  usa: 'NA',
  us: 'NA',
  'united states': 'NA',
  'united states of america': 'NA',
  canada: 'NA',
  ca: 'NA',

  // Latin America & Caribbean (LATAM)
  brazil: 'LATAM', br: 'LATAM',
  mexico: 'LATAM', mx: 'LATAM',
  argentina: 'LATAM', ar: 'LATAM',
  colombia: 'LATAM', co: 'LATAM',
  chile: 'LATAM', cl: 'LATAM',
  peru: 'LATAM', pe: 'LATAM',
  ecuador: 'LATAM', ec: 'LATAM',
  bolivia: 'LATAM', bo: 'LATAM',
  paraguay: 'LATAM', py: 'LATAM',
  uruguay: 'LATAM', uy: 'LATAM',
  venezuela: 'LATAM', ve: 'LATAM',
  'costa rica': 'LATAM', cr: 'LATAM',
  panama: 'LATAM', pa: 'LATAM',
  guatemala: 'LATAM', gt: 'LATAM',
  honduras: 'LATAM', hn: 'LATAM',
  'el salvador': 'LATAM', sv: 'LATAM',
  nicaragua: 'LATAM', ni: 'LATAM',
  'dominican republic': 'LATAM', do: 'LATAM',
  'puerto rico': 'LATAM', pr: 'LATAM',
  jamaica: 'LATAM', jm: 'LATAM',
  'trinidad and tobago': 'LATAM', tt: 'LATAM',
  aruba: 'LATAM', aw: 'LATAM',
  cuba: 'LATAM', cu: 'LATAM',
  haiti: 'LATAM', ht: 'LATAM',
  guyana: 'LATAM', gy: 'LATAM',
  suriname: 'LATAM', sr: 'LATAM',

  // Middle East, North Africa & Türkiye (MENAT)
  turkey: 'MENAT', türkiye: 'MENAT', turkiye: 'MENAT', tr: 'MENAT',
  uae: 'MENAT', ae: 'MENAT', 'united arab emirates': 'MENAT',
  'saudi arabia': 'MENAT', sa: 'MENAT',
  egypt: 'MENAT', eg: 'MENAT',
  morocco: 'MENAT', ma: 'MENAT',
  jordan: 'MENAT', jo: 'MENAT',
  tunisia: 'MENAT', tn: 'MENAT',
  qatar: 'MENAT', qa: 'MENAT',
  israel: 'MENAT', il: 'MENAT',
  algeria: 'MENAT', dz: 'MENAT',
  libya: 'MENAT', ly: 'MENAT',
  lebanon: 'MENAT', lb: 'MENAT',
  iraq: 'MENAT', iq: 'MENAT',
  kuwait: 'MENAT', kw: 'MENAT',
  oman: 'MENAT', om: 'MENAT',
  bahrain: 'MENAT', bh: 'MENAT',
  palestine: 'MENAT', ps: 'MENAT',
  yemen: 'MENAT', ye: 'MENAT',
  syria: 'MENAT', sy: 'MENAT',

  // Sub-Saharan Africa (SSA)
  nigeria: 'SSA', ng: 'SSA',
  kenya: 'SSA', ke: 'SSA',
  'south africa': 'SSA', za: 'SSA',
  ghana: 'SSA', gh: 'SSA',
  uganda: 'SSA', ug: 'SSA',
  rwanda: 'SSA', rw: 'SSA',
  senegal: 'SSA', sn: 'SSA',
  tanzania: 'SSA', tz: 'SSA',
  ethiopia: 'SSA', et: 'SSA',
  cameroon: 'SSA', cm: 'SSA',
  "côte d'ivoire": 'SSA', "cote d'ivoire": 'SSA', 'ivory coast': 'SSA', ci: 'SSA',
  congo: 'SSA', 'congo (the democratic republic of the)': 'SSA', 'democratic republic of the congo': 'SSA', drc: 'SSA', cd: 'SSA', cg: 'SSA',
  angola: 'SSA', ao: 'SSA',
  zambia: 'SSA', zm: 'SSA',
  zimbabwe: 'SSA', zw: 'SSA',
  mozambique: 'SSA', mz: 'SSA',
  madagascar: 'SSA', mg: 'SSA',
  namibia: 'SSA', na: 'SSA',
  botswana: 'SSA', bw: 'SSA',
  malawi: 'SSA', mw: 'SSA',
  lesotho: 'SSA', ls: 'SSA',
  eswatini: 'SSA', sz: 'SSA',
  mauritius: 'SSA', mu: 'SSA',
  gabon: 'SSA', ga: 'SSA',
  burundi: 'SSA', bi: 'SSA',
  togo: 'SSA', tg: 'SSA',
  benin: 'SSA', bj: 'SSA',
  'burkina faso': 'SSA', bf: 'SSA',
  niger: 'SSA', ne: 'SSA',
  mali: 'SSA', ml: 'SSA',
  guinea: 'SSA', gn: 'SSA',
  gambia: 'SSA', gm: 'SSA',
  'sierra leone': 'SSA', sl: 'SSA',
  liberia: 'SSA', lr: 'SSA',
  chad: 'SSA', td: 'SSA',
  sudan: 'SSA', sd: 'SSA',
  'south sudan': 'SSA', ss: 'SSA',
  somalia: 'SSA', so: 'SSA',

  // India
  india: 'India', in: 'India',

  // Asia-Pacific & Central Asia (APAC)
  japan: 'APAC', jp: 'APAC',
  singapore: 'APAC', sg: 'APAC',
  australia: 'APAC', au: 'APAC',
  'new zealand': 'APAC', nz: 'APAC',
  'south korea': 'APAC', kr: 'APAC', 'korea, republic of': 'APAC', korea: 'APAC',
  taiwan: 'APAC', tw: 'APAC',
  'hong kong': 'APAC', hk: 'APAC',
  china: 'APAC', cn: 'APAC',
  indonesia: 'APAC', id: 'APAC',
  malaysia: 'APAC', my: 'APAC',
  philippines: 'APAC', ph: 'APAC',
  thailand: 'APAC', th: 'APAC',
  vietnam: 'APAC', vn: 'APAC', 'viet nam': 'APAC',
  pakistan: 'APAC', pk: 'APAC',
  bangladesh: 'APAC', bd: 'APAC',
  'sri lanka': 'APAC', lk: 'APAC',
  nepal: 'APAC', np: 'APAC',
  myanmar: 'APAC', mm: 'APAC',
  cambodia: 'APAC', kh: 'APAC',
  laos: 'APAC', la: 'APAC',
  mongolia: 'APAC', mn: 'APAC',
  brunei: 'APAC', bn: 'APAC',
  fiji: 'APAC', fj: 'APAC',
  kazakhstan: 'APAC', kz: 'APAC',
  uzbekistan: 'APAC', uz: 'APAC',
  kyrgyzstan: 'APAC', kg: 'APAC',
  tajikistan: 'APAC', tj: 'APAC',
  turkmenistan: 'APAC', tm: 'APAC',
};

export function resolveRegion(
  country: string,
  fallback: GdeRegion = 'Europe',
  countryCode?: string,
): GdeRegion {
  if (countryCode) {
    const codeKey = countryCode.trim().toLowerCase();
    if (COUNTRY_TO_REGION[codeKey]) return COUNTRY_TO_REGION[codeKey];
  }
  const key = country.trim().toLowerCase();
  if (COUNTRY_TO_REGION[key]) return COUNTRY_TO_REGION[key];

  // Strip parenthetical suffixes like "Congo (the Democratic Republic of the)" or "Bolivia (Plurinational State of)"
  const baseKey = key.replace(/\s*\(.*?\)\s*/g, '').replace(/,.*$/, '').trim();
  if (COUNTRY_TO_REGION[baseKey]) return COUNTRY_TO_REGION[baseKey];

  return fallback;
}

export function calculateBudgetUsd(
  eventRegion: GdeRegion,
  departureRegion: GdeRegion,
  eventCountry?: string,
  departureCountry?: string,
): number {
  const normEventCountry = (eventCountry ?? '').trim().toLowerCase();
  const normDepCountry = (departureCountry ?? '').trim().toLowerCase();
  if (normEventCountry && normDepCountry && normEventCountry === normDepCountry) {
    return 600;
  }
  return eventRegion === departureRegion ? 800 : 1200;
}

export interface ConflictAlert {
  withEventId: string;
  withTitle: string;
  severity: 'overlap' | 'adjacent';
  message: string;
}

function toDayNumber(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return 0;
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function normalizeEventIdentity(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/\b(call for papers|cfp|session|talk|workshop|202\d|'2\d)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function isSameConferenceEvent(a: GdeEvent, b: GdeEvent): boolean {
  if (a.id === b.id) return true;
  const titleA = normalizeEventIdentity(a.title);
  const titleB = normalizeEventIdentity(b.title);
  if (
    titleA &&
    titleB &&
    (titleA === titleB ||
      (titleA.length >= 8 && titleB.length >= 8 && (titleA.includes(titleB) || titleB.includes(titleA))))
  ) {
    return true;
  }
  const sameCity =
    Boolean(a.city && b.city) &&
    a.city.trim().toLowerCase() === b.city.trim().toLowerCase() &&
    a.country.trim().toLowerCase() === b.country.trim().toLowerCase();
  if (sameCity && a.startDate === b.startDate) {
    return true;
  }
  return false;
}

/**
 * Returns true if an active/upcoming event (not Completed or Declined)
 * has been applied to — including events that have already been Confirmed
 * or progressed into WorkTrips Requested / Approved.
 */
export function isActiveAppliedEvent(ev: GdeEvent): boolean {
  if (ev.status === 'Completed' || ev.status === 'Declined') return false;
  return Boolean(
    ev.status === 'Applied' ||
      ev.status === 'Confirmed' ||
      ev.eventApplied ||
      ev.eventApproved ||
      ev.worktripsRequested ||
      ev.worktripsApproved ||
      (ev.travelApprovalStatus && ev.travelApprovalStatus !== 'Not Submitted'),
  );
}

/**
 * Returns true if an active/upcoming event (not Completed or Declined)
 * is Confirmed / Event Approved / in WorkTrips.
 */
export function isActiveConfirmedEvent(ev: GdeEvent): boolean {
  if (ev.status === 'Completed' || ev.status === 'Declined') return false;
  return Boolean(
    ev.status === 'Confirmed' ||
      ev.eventApproved ||
      ev.worktripsRequested ||
      ev.worktripsApproved ||
      ev.travelApprovalStatus === 'Approved',
  );
}

export function detectConflicts(events: GdeEvent[]): Map<string, ConflictAlert[]> {
  // Only check active/upcoming events (exclude Completed and Declined)
  const active = events.filter((e) => e.status !== 'Declined' && e.status !== 'Completed');
  const map = new Map<string, ConflictAlert[]>();

  for (const ev of events) {
    map.set(ev.id, []);
  }

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];

      // Two sessions at the same event/conference are NOT a conflict
      if (isSameConferenceEvent(a, b)) continue;

      const aStart = toDayNumber(a.startDate);
      const aEnd = Math.max(aStart, toDayNumber(a.endDate || a.startDate));
      const bStart = toDayNumber(b.startDate);
      const bEnd = Math.max(bStart, toDayNumber(b.endDate || b.startDate));

      if (!aStart || !bStart) continue;

      if (aStart <= bEnd && bStart <= aEnd) {
        map.get(a.id)?.push({
          withEventId: b.id,
          withTitle: b.title,
          severity: 'overlap',
          message: `Overlaps with ${b.title} (${b.startDate})`,
        });
        map.get(b.id)?.push({
          withEventId: a.id,
          withTitle: a.title,
          severity: 'overlap',
          message: `Overlaps with ${a.title} (${a.startDate})`,
        });
      } else if (Math.abs(aEnd - bStart) === 1 || Math.abs(bEnd - aStart) === 1) {
        map.get(a.id)?.push({
          withEventId: b.id,
          withTitle: b.title,
          severity: 'adjacent',
          message: `Back-to-back with ${b.title} (${b.startDate})`,
        });
        map.get(b.id)?.push({
          withEventId: a.id,
          withTitle: a.title,
          severity: 'adjacent',
          message: `Back-to-back with ${a.title} (${a.startDate})`,
        });
      }
    }
  }

  return map;
}

export interface DiscoverItineraryMatch {
  matchedStatus: EventStatus | null;
  clashesWithConfirmed: string[];
}

function normalizeUrlForMatch(raw?: string): string {
  const s = String(raw || '').trim().toLowerCase();
  if (
    !s ||
    s === 'https://gdg.community.dev' ||
    s === 'https://gdg.community.dev/' ||
    s.includes('docs.google.com/spreadsheets')
  ) {
    return '';
  }
  return s.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
}

function isDiscoveredSameAsItinerary(
  d: {
    title: string;
    city: string;
    country: string;
    startDate: string;
    url?: string;
    cfpUrl?: string;
  },
  ev: GdeEvent,
): boolean {
  const dUrl = normalizeUrlForMatch(d.url);
  const dCfp = normalizeUrlForMatch(d.cfpUrl);
  const evUrl = normalizeUrlForMatch(ev.eventUrl);
  const evCfp = normalizeUrlForMatch(ev.cfpUrl);
  if (dUrl && (dUrl === evUrl || dUrl === evCfp)) return true;
  if (dCfp && (dCfp === evUrl || dCfp === evCfp)) return true;

  const titleA = normalizeEventIdentity(d.title);
  const titleB = normalizeEventIdentity(ev.title);
  const titlesMatch =
    Boolean(titleA && titleB) &&
    (titleA === titleB ||
      (titleA.length >= 8 &&
        titleB.length >= 8 &&
        (titleA.includes(titleB) || titleB.includes(titleA))));

  if (titlesMatch) {
    if (!d.startDate || !ev.startDate) return true;
    const diffDays = Math.abs(toDayNumber(d.startDate) - toDayNumber(ev.startDate));
    if (diffDays <= 5) return true;
  }

  const sameCity =
    Boolean(d.city && ev.city) &&
    d.city.trim().toLowerCase() === ev.city.trim().toLowerCase() &&
    d.country.trim().toLowerCase() === ev.country.trim().toLowerCase();
  if (
    sameCity &&
    d.startDate &&
    d.startDate === ev.startDate &&
    (titlesMatch || (titleA.includes('devfest') && titleB.includes('devfest')))
  ) {
    return true;
  }
  return false;
}

export function matchDiscoverWithItinerary(
  d: {
    title: string;
    city: string;
    country: string;
    startDate: string;
    endDate?: string;
    url?: string;
    cfpUrl?: string;
  },
  userEvents: GdeEvent[],
): DiscoverItineraryMatch {
  const statusPriority: Record<EventStatus, number> = {
    Confirmed: 5,
    Applied: 4,
    Completed: 3,
    Considering: 2,
    Declined: 1,
  };

  let matchedStatus: EventStatus | null = null;
  for (const ev of userEvents) {
    if (isDiscoveredSameAsItinerary(d, ev)) {
      const effectiveStatus: EventStatus =
        ev.status === 'Confirmed' ||
        (Boolean(ev.eventApproved) && ev.status !== 'Completed' && ev.status !== 'Declined')
          ? 'Confirmed'
          : ev.status;
      if (!matchedStatus || statusPriority[effectiveStatus] > statusPriority[matchedStatus]) {
        matchedStatus = effectiveStatus;
      }
    }
  }

  const clashesWithConfirmed: string[] = [];
  if (d.startDate) {
    const dStart = toDayNumber(d.startDate);
    const dEnd = Math.max(dStart, toDayNumber(d.endDate || d.startDate));
    if (dStart > 0) {
      const seenTitles = new Set<string>();
      for (const ev of userEvents) {
        const isConfirmed =
          ev.status === 'Confirmed' ||
          (Boolean(ev.eventApproved) && ev.status !== 'Completed' && ev.status !== 'Declined');
        if (!isConfirmed) continue;
        if (isDiscoveredSameAsItinerary(d, ev)) continue;

        const evStart = toDayNumber(ev.startDate);
        const evEnd = Math.max(evStart, toDayNumber(ev.endDate || ev.startDate));
        if (!evStart) continue;

        if (dStart <= evEnd && evStart <= dEnd) {
          const cleanTitle = ev.title.trim();
          const key = cleanTitle.toLowerCase();
          if (cleanTitle && !seenTitles.has(key)) {
            seenTitles.add(key);
            clashesWithConfirmed.push(cleanTitle);
          }
        }
      }
    }
  }

  return { matchedStatus, clashesWithConfirmed };
}

export interface DiscoverConferenceEvalInput {
  title: string;
  startDate: string;
  endDate?: string;
  rawCfpStatus?: string;
  parsedCfpDeadline?: string;
  todayIso?: string;
}

export interface DiscoverConferenceEvalResult {
  skip: boolean;
  skipReason?: 'missing-start' | 'past-event' | 'stale-title-year';
  startDate: string;
  endDate: string;
  isInProgress: boolean;
  effectiveCfpStatus: 'OPEN' | 'CLOSED' | '';
  cfpDeadline: string;
}

export function evaluateDiscoverConferenceRow(
  input: DiscoverConferenceEvalInput,
): DiscoverConferenceEvalResult {
  const todayIso = (input.todayIso || new Date().toISOString().slice(0, 10)).trim();
  const startDate = (input.startDate || '').trim();
  if (!startDate) {
    return {
      skip: true,
      skipReason: 'missing-start',
      startDate: '',
      endDate: '',
      isInProgress: false,
      effectiveCfpStatus: '',
      cfpDeadline: '',
    };
  }

  const rawEnd = (input.endDate || startDate).trim() || startDate;
  const startDay = toDayNumber(startDate);
  const rawEndDay = toDayNumber(rawEnd);
  const endDate =
    !rawEndDay || rawEndDay < startDay || rawEndDay - startDay > 14 ? startDate : rawEnd;

  if (endDate < todayIso) {
    return {
      skip: true,
      skipReason: 'past-event',
      startDate,
      endDate,
      isInProgress: false,
      effectiveCfpStatus: 'CLOSED',
      cfpDeadline: '',
    };
  }

  const startYear = startDate.slice(0, 4);
  const title = (input.title || '').trim();
  const editionYears: string[] = [];
  for (const m of title.matchAll(/\b(202[0-8])\b/g)) {
    editionYears.push(m[1]);
  }
  for (const m of title.matchAll(/(?:^|\s)'(2[0-8])\b/g)) {
    editionYears.push(`20${m[1]}`);
  }
  if (editionYears.some((yr) => yr !== startYear)) {
    return {
      skip: true,
      skipReason: 'stale-title-year',
      startDate,
      endDate,
      isInProgress: false,
      effectiveCfpStatus: '',
      cfpDeadline: '',
    };
  }

  const isInProgress = startDate <= todayIso && endDate >= todayIso;
  const sheetStatus = (input.rawCfpStatus || '').trim().toUpperCase();
  const cfpDeadline = (input.parsedCfpDeadline || '').trim();

  let effectiveCfpStatus: 'OPEN' | 'CLOSED' | '' = '';
  if (
    sheetStatus === 'OPEN' &&
    !isInProgress &&
    Boolean(cfpDeadline && cfpDeadline >= todayIso)
  ) {
    effectiveCfpStatus = 'OPEN';
  } else if (
    sheetStatus === 'CLOSED' ||
    Boolean(cfpDeadline && cfpDeadline < todayIso) ||
    (sheetStatus === 'OPEN' && isInProgress)
  ) {
    effectiveCfpStatus = 'CLOSED';
  }

  return {
    skip: false,
    startDate,
    endDate,
    isInProgress,
    effectiveCfpStatus,
    cfpDeadline,
  };
}

export interface TravelWorkflowAlert {
  reimbursementState:
    | 'submitted-on-time'
    | 'flagged-red'
    | 'window-open'
    | 'upcoming';
  isRedAlert: boolean;
  reimbursementMessage: string;
}

export function evaluateTravelWorkflow(
  event: GdeEvent,
  todayIso: string = new Date().toISOString().slice(0, 10),
): TravelWorkflowAlert {
  const today = toDayNumber(todayIso);
  const start = toDayNumber(event.startDate);
  const end = Math.max(start, toDayNumber(event.endDate || event.startDate));
  const earliestAllowed = start - 21;
  const latestAllowed = end + 21;

  const subDateStr = (event.reimbursementSubmittedDate || '').trim();
  if (event.reimbursementSubmitted || Boolean(subDateStr)) {
    const subDay = toDayNumber(subDateStr);

    if (subDay > 0) {
      if (subDay < earliestAllowed) {
        const daysEarly = start - subDay;
        return {
          reimbursementState: 'flagged-red',
          isRedAlert: true,
          reimbursementMessage: `⚠️ Submitted ${subDateStr} (${daysEarly}d before event, >21d limit) — Follow up with Travel Support`,
        };
      }
      if (subDay > latestAllowed) {
        const daysLate = subDay - end;
        return {
          reimbursementState: 'flagged-red',
          isRedAlert: true,
          reimbursementMessage: `⚠️ Submitted ${subDateStr} (${daysLate}d after event, >21d limit) — Follow up with Travel Support`,
        };
      }
      return {
        reimbursementState: 'submitted-on-time',
        isRedAlert: false,
        reimbursementMessage: `Reimbursement submitted ${subDateStr} (within ±21d) ✓`,
      };
    }

    return {
      reimbursementState: 'submitted-on-time',
      isRedAlert: false,
      reimbursementMessage: 'Reimbursement submitted (add submission date to verify ±21d)',
    };
  }

  const daysFromStart = today - start;
  const daysAfterEnd = today - end;

  if (daysAfterEnd > 21) {
    return {
      reimbursementState: 'flagged-red',
      isRedAlert: true,
      reimbursementMessage: `⚠️ Overdue (${daysAfterEnd}d post-event, >21d limit) — Follow up with Travel Support`,
    };
  }

  if (daysFromStart >= -21 && daysAfterEnd <= 21) {
    const remaining = 21 - Math.max(0, daysAfterEnd);
    return {
      reimbursementState: 'window-open',
      isRedAlert: false,
      reimbursementMessage: `21d Reimbursement Window Open (${remaining}d left)`,
    };
  }

  return {
    reimbursementState: 'upcoming',
    isRedAlert: false,
    reimbursementMessage: 'Submit reimbursement within ±21d of event',
  };
}
