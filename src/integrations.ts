import {
  ASCII_MASKED_ADVOCU_KEY,
  calculateBudgetUsd,
  type CfpPlatform,
  DEFAULT_ANDRES_PROFILE,
  type EventCampaign,
  type EventPhoto,
  type GdeCategory,
  type GdeEvent,
  type GdeProfile,
  type GdeRegion,
  isMaskedAdvocuKey,
  resolveRegion,
  sanitizeBearerHeaderToken,
} from './policy.ts';
import {
  getFirebaseIdToken,
  MASKED_ADVOCU_KEY,
  syncEncryptedAdvocuKeyToServer,
} from './firebase.ts';

export type DiscoverSourceType =
  | 'Live GDG'
  | 'EMEA Conference'
  | 'Non-GDG Community'
  | 'EMEA GDG Chapter';

export interface DiscoveredEvent {
  externalId: string;
  title: string;
  campaign: EventCampaign;
  source?: DiscoverSourceType;
  region?: GdeRegion;
  city: string;
  country: string;
  countryCode?: string;
  startDate: string;
  endDate: string;
  url: string;
  cfpUrl?: string;
  cfpStatus?: string;
  cfpDeadline?: string;
  cfpDeadlineRaw?: string;
  isInProgress?: boolean;
  techFocus?: string;
  cadence?: string;
  description?: string;
  eventFormat?: 'In-Person' | 'Hybrid' | 'Virtual';
  expectedAudience?: number;
  isGdgOnCampus: boolean;
  chapterTitle: string;
}

function detectCampaign(title: string, eventTypeTitle: string = ''): EventCampaign {
  const combined = `${title} ${eventTypeTitle}`.toLowerCase();
  if (combined.includes('devfest')) return 'DevFest';
  if (combined.includes('build with ai') || combined.includes('bwai')) return 'Build with AI';
  if (combined.includes('i/o extended') || combined.includes('io extended')) return 'I/O Extended';
  return 'GDG';
}

export const OFFLINE_DEVFEST_FALLBACK: DiscoveredEvent[] = [
  {
    externalId: 'gdg-devfest-berlin-2026',
    title: 'DevFest Berlin 2026',
    campaign: 'DevFest',
    city: 'Berlin',
    country: 'Germany',
    startDate: '2026-11-14',
    endDate: '2026-11-14',
    url: 'https://gdg.community.dev/gdg-berlin/',
    isGdgOnCampus: false,
    chapterTitle: 'GDG Berlin',
  },
  {
    externalId: 'gdg-devfest-london-2026',
    title: 'DevFest London 2026',
    campaign: 'DevFest',
    city: 'London',
    country: 'United Kingdom',
    startDate: '2026-11-21',
    endDate: '2026-11-21',
    url: 'https://gdg.community.dev/gdg-london/',
    isGdgOnCampus: false,
    chapterTitle: 'GDG London',
  },
  {
    externalId: 'gdg-devfest-nantes-2026',
    title: 'DevFest Nantes 2026',
    campaign: 'DevFest',
    city: 'Nantes',
    country: 'France',
    startDate: '2026-10-22',
    endDate: '2026-10-23',
    url: 'https://devfest.gdgnantes.com/',
    isGdgOnCampus: false,
    chapterTitle: 'GDG Nantes',
  },
  {
    externalId: 'gdg-devfest-milano-2026',
    title: 'DevFest Milano 2026',
    campaign: 'DevFest',
    city: 'Milan',
    country: 'Italy',
    startDate: '2026-11-07',
    endDate: '2026-11-07',
    url: 'https://gdg.community.dev/gdg-milano/',
    isGdgOnCampus: false,
    chapterTitle: 'GDG Milano',
  },
  {
    externalId: 'gdg-devfest-cairo-2026',
    title: 'DevFest Cairo 2026 (MENAT)',
    campaign: 'DevFest',
    city: 'Cairo',
    country: 'Egypt',
    startDate: '2026-12-05',
    endDate: '2026-12-05',
    url: 'https://gdg.community.dev/gdg-cairo/',
    isGdgOnCampus: false,
    chapterTitle: 'GDG Cairo',
  },
  {
    externalId: 'gdg-bwai-nairobi-2026',
    title: 'Build with AI Nairobi Summit 2026 (SSA)',
    campaign: 'Build with AI',
    city: 'Nairobi',
    country: 'Kenya',
    startDate: '2026-11-28',
    endDate: '2026-11-28',
    url: 'https://gdg.community.dev/gdg-nairobi/',
    isGdgOnCampus: false,
    chapterTitle: 'GDG Nairobi',
  },
  {
    externalId: 'gdg-devfest-nyc-2026',
    title: 'DevFest New York City 2026 (NA)',
    campaign: 'DevFest',
    city: 'New York',
    country: 'United States',
    startDate: '2026-11-18',
    endDate: '2026-11-18',
    url: 'https://gdg.community.dev/gdg-nyc/',
    isGdgOnCampus: false,
    chapterTitle: 'GDG NYC',
  },
];

function decodeBrowserJwt(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export interface AdvocuSyncResponse {
  ok: boolean;
  message: string;
  profilePatch: Partial<GdeProfile>;
  importedEvents: GdeEvent[];
}

/**
 * Looks up the GDE's public profile from https://me.developers.google.com/communities/experts
 * to populate their avatar image, bio, organization, location/country, and GDE specializations.
 */
export async function fetchGdeDirectoryProfile(
  name: string,
  email: string,
  slug: string = '',
): Promise<Partial<GdeProfile> | null> {
  try {
    const res = await fetch('/api/advocu/gde-directory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, slug }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const dir = data?.gdeDirectoryProfile;
    if (!dir) return null;

    const country = String(dir.country || '').trim();
    const region = country ? resolveRegion(country, 'Europe') : 'Europe';

    return {
      avatarUrl: String(dir.avatarUrl || ''),
      organization: String(dir.organization || ''),
      bio: String(dir.bio || ''),
      location: String(dir.location || ''),
      gdeProfileUrl: String(dir.profileUrl || ''),
      specializations: Array.isArray(dir.specializations) ? dir.specializations : [],
      ...(country
        ? {
            homeCountry: country,
            homeRegion: region,
            currentCountry: country,
            currentRegion: region,
          }
        : {}),
      ...(Array.isArray(dir.categories) && dir.categories.length > 0
        ? { categories: dir.categories as GdeCategory[] }
        : {}),
    };
  } catch {
    return null;
  }
}

/**
 * Connects with the GDE's personal Advocu API key to auto-populate their profile
 * (name, email, country, region, categories) and pull any recent activities.
 */
export async function syncFromAdvocuKey(
  rawToken: string,
  signedInEmail: string,
  signedInName: string,
): Promise<AdvocuSyncResponse> {
  const token = rawToken.trim();
  if (!token) {
    return {
      ok: false,
      message: 'Please enter your Advocu API key first.',
      profilePatch: {},
      importedEvents: [],
    };
  }

  const basePatch: Partial<GdeProfile> = {
    advocuApiKey: token,
    displayName: signedInName || '',
    email: signedInEmail || '',
    sessionizeEmail: '',
    homeCountry: '',
    homeRegion: 'Europe',
    currentCountry: '',
    currentRegion: 'Europe',
    categories: [],
  };

  // Decode JWT claims if token is JWT-formatted
  const jwt = decodeBrowserJwt(token);
  if (jwt) {
    if (typeof jwt.email === 'string' && jwt.email.includes('@')) {
      basePatch.email = jwt.email;
    }
    if (typeof jwt.name === 'string' && jwt.name.trim()) {
      basePatch.displayName = jwt.name.trim();
    }
    if (typeof jwt.country === 'string' && jwt.country.trim()) {
      basePatch.homeCountry = jwt.country.trim();
      basePatch.homeRegion = resolveRegion(jwt.country.trim(), 'Europe');
      basePatch.currentCountry = basePatch.homeCountry;
      basePatch.currentRegion = basePatch.homeRegion;
    }
  }

  const importedEvents: GdeEvent[] = [];
  let authVerified = true;
  let totalActivitiesCount = 0;

  const mapAdvocuTagToCategory = (tag: string): GdeCategory | null => {
    const t = tag.trim();
    if (t === 'AI' || t.startsWith('AI -') || t.startsWith('AI ')) return 'AI';
    if (
      t === 'Google Cloud' ||
      t === 'Cloud' ||
      t.startsWith('Cloud -') ||
      t.startsWith('Kubernetes')
    )
      return 'Cloud';
    if (t === 'Firebase' || t.startsWith('Firebase -')) return 'Firebase';
    if (t === 'Android' || t.startsWith('Android -')) return 'Android';
    if (t === 'Angular' || t.startsWith('Angular -')) return 'Angular';
    if (t === 'Flutter' || t.startsWith('Flutter -') || t.startsWith('Dart -')) return 'Flutter';
    if (t === 'Web' || t.startsWith('Web -') || t.startsWith('Chrome')) return 'Web';
    if (t === 'Go' || t.startsWith('Go -')) return 'Go';
    if (t.includes('Workspace')) return 'Workspace';
    if (t.includes('Earth Engine')) return 'Earth Engine';
    if (t.includes('Pay') || t.includes('Wallet')) return 'Payments';
    return null;
  };

  try {
    const idToken = await getFirebaseIdToken();
    const cleanToken = sanitizeBearerHeaderToken(token);
    if (!cleanToken) {
      return {
        ok: false,
        message: 'Please enter a valid Advocu API key.',
        profilePatch: {},
        importedEvents: [],
      };
    }
    if (idToken && !isMaskedAdvocuKey(token)) {
      await syncEncryptedAdvocuKeyToServer(cleanToken);
      basePatch.advocuApiKey = MASKED_ADVOCU_KEY;
    }
    const bearerForSync = idToken ? ASCII_MASKED_ADVOCU_KEY : cleanToken;
    const res = await fetch('/api/advocu/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerForSync}`,
        ...(idToken ? { 'X-Firebase-Id-Token': idToken } : {}),
      },
      body: JSON.stringify({
        token: bearerForSync,
        email: basePatch.email,
        name: basePatch.displayName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.authValid === false) {
        authVerified = false;
      } else if (idToken) {
        basePatch.advocuApiKey = MASKED_ADVOCU_KEY;
      }

      const dir = data?.gdeDirectoryProfile;
      const directoryCategories = new Set<GdeCategory>();
      if (dir && typeof dir === 'object') {
        if (dir.avatarUrl) basePatch.avatarUrl = String(dir.avatarUrl);
        if (dir.organization) basePatch.organization = String(dir.organization);
        if (dir.bio) basePatch.bio = String(dir.bio);
        if (dir.location) basePatch.location = String(dir.location);
        if (dir.profileUrl) basePatch.gdeProfileUrl = String(dir.profileUrl);
        if (Array.isArray(dir.specializations)) {
          basePatch.specializations = dir.specializations;
        }
        if (dir.country) {
          basePatch.homeCountry = String(dir.country);
          basePatch.homeRegion = resolveRegion(basePatch.homeCountry, 'Europe');
          basePatch.currentCountry = basePatch.homeCountry;
          basePatch.currentRegion = basePatch.homeRegion;
        }
        if (Array.isArray(dir.categories)) {
          for (const c of dir.categories) {
            directoryCategories.add(c as GdeCategory);
          }
        }
      }

      if (Array.isArray(data?.activities)) {
        totalActivitiesCount = data.activities.length;
        const categoryActivityCounts = new Map<GdeCategory, number>();

        for (const item of data.activities) {
          const d = item?.data && typeof item.data === 'object' ? item.data : item;
          const itemType = String(item?.type || d?.type || '');

          // Count GDE categories across activities
          if (Array.isArray(d?.tags)) {
            const seenInActivity = new Set<GdeCategory>();
            for (const rawTag of d.tags) {
              const cat = mapAdvocuTagToCategory(String(rawTag));
              if (cat) seenInActivity.add(cat);
            }
            for (const cat of seenInActivity) {
              categoryActivityCounts.set(cat, (categoryActivityCounts.get(cat) || 0) + 1);
            }
          }

          // Import public-speaking and workshop activities into the travel itinerary
          if (itemType === 'public-speaking' || itemType === 'workshop') {
            const talkTitle = String(d?.title || 'Advocu Activity').trim();
            const startDate = String(
              d?.activityDate || item?.submissionDate || new Date().toISOString(),
            ).slice(0, 10);
            const rawCity = String(d?.city || '')
              .split(',')[0]
              .trim();
            const isVirtual = String(d?.eventFormat || '').toLowerCase() === 'virtual';
            const country = String(
              d?.country || (isVirtual ? 'Online' : basePatch.homeCountry || 'Online'),
            ).trim();
            const region = resolveRegion(country, basePatch.homeRegion || 'Europe');
            const depCountry = basePatch.currentCountry || country;
            const depRegion = basePatch.currentRegion || region;
            const activityUrl = String(d?.activityUrl || '').trim();
            const activityId = String(item?.activityId || item?.id || `${startDate}-${talkTitle}`);
            const campaign = detectCampaign(
              `${talkTitle} ${activityUrl} ${Array.isArray(d?.tags) ? d.tags.join(' ') : ''}`,
            );
            const eventTitle = rawCity
              ? `${campaign === '3rd-Party' ? 'GDG' : campaign} ${rawCity} (${startDate.slice(0, 4)})`
              : talkTitle;

            importedEvents.push({
              id: `advocu-${activityId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
              title: eventTitle,
              campaign,
              city: rawCity,
              country,
              region,
              startDate,
              endDate: startDate,
              status: 'Completed',
              cfpPlatform: 'Advocu',
              cfpUrl: activityUrl,
              eventUrl: activityUrl,
              sessionTitle: talkTitle,
              activityType: itemType === 'workshop' ? 'Workshop' : 'Talk',
              eventFormat: d?.eventFormat || 'In-Person',
              expectedAudience: Number(d?.metrics?.attendees || d?.inPersonAttendees || 100),
              isGdgOnCampus: false,
              budgetUsd: isVirtual ? 0 : calculateBudgetUsd(region, depRegion, country, depCountry),
              worktripsRequested: !isVirtual,
              worktripsApproved: !isVirtual,
              worktripsTravelRequested: !isVirtual,
              worktripsTravelApproved: !isVirtual,
              budgetApproved: !isVirtual,
              bookingMode: isVirtual ? 'None' : 'WorkTrips Direct',
              travelApprovalStatus: isVirtual ? 'Not Needed' : 'Approved',
              flightBooked: !isVirtual,
              hotelBooked: !isVirtual,
              worktripsRef: '',
              reimbursementSubmitted: !isVirtual,
              reimbursementSubmittedDate: !isVirtual ? startDate : '',
              reimbursementAmountUsd: 0,
              advocuSynced: true,
              photos: [],
              notes: String(d?.description_plain_text || d?.description || 'Imported from Advocu'),
              updatedAt: new Date().toISOString(),
            });
          }
        }

        const minCount = totalActivitiesCount >= 3 ? 2 : 1;
        let inferredCategories = Array.from(categoryActivityCounts.entries())
          .filter(([, count]) => count >= minCount)
          .sort((a, b) => b[1] - a[1])
          .map(([cat]) => cat);
        if (inferredCategories.length === 0 && categoryActivityCounts.size > 0) {
          inferredCategories = Array.from(categoryActivityCounts.keys());
        }
        const mergedCats = new Set<GdeCategory>([
          ...directoryCategories,
          ...inferredCategories,
        ]);
        if (mergedCats.size > 0) {
          basePatch.categories = Array.from(mergedCats);
        }
      } else if (directoryCategories.size > 0) {
        basePatch.categories = Array.from(directoryCategories);
      }
    }
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : 'Could not securely save or sync your Advocu API key. Please try again.',
      profilePatch: {},
      importedEvents: [],
    };
  }

  const catsLabel =
    basePatch.categories && basePatch.categories.length > 0
      ? ` · Categories: ${basePatch.categories.join(', ')}`
      : '';
  const locLabel = basePatch.location
    ? ` · Location: ${basePatch.location} (${basePatch.homeRegion})`
    : '';

  return {
    ok: authVerified,
    message: !authVerified
      ? `Advocu returned 401 Unauthorized for this token — please verify your Personal API key at app.advocu.com/settings/integrations/personal-api.`
      : totalActivitiesCount > 0
        ? `Connected to Advocu & GDE Directory! Retrieved ${totalActivitiesCount} Advocu activities (${importedEvents.length} speaking/workshop events imported)${locLabel}${catsLabel}.`
        : `Connected to Advocu & GDE Directory for ${basePatch.displayName || 'GDE'}${locLabel}${catsLabel}.`,
    profilePatch: basePatch,
    importedEvents,
  };
}

/**
 * Fetches live upcoming events from gdg.community.dev (Bevy public API, CORS: *)
 * AND live EMEA Conferences, Non-GDG Communities & GDG Chapters from the EMEA Hub Google Sheet.
 */
export async function fetchLiveGdgEvents(): Promise<DiscoveredEvent[]> {
  const bevyUrl =
    'https://gdg.community.dev/api/event/?status=Live&fields=id,title,start_date,end_date,url,chapter,event_type_title&page_size=500';

  const [bevyOutcome, sheetOutcome] = await Promise.allSettled([
    fetch(bevyUrl).then((r) => (r.ok ? r.json() : null)),
    fetch('/api/advocu/emea-hub-events').then((r) => (r.ok ? r.json() : null)),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const datedEvents: DiscoveredEvent[] = [];
  const recurringItems: DiscoveredEvent[] = [];

  if (bevyOutcome.status === 'fulfilled' && bevyOutcome.value) {
    const rawList: Array<Record<string, any>> = Array.isArray(bevyOutcome.value?.results)
      ? bevyOutcome.value.results
      : [];

    for (const item of rawList) {
      const startDate = String(item.start_date ?? '').slice(0, 10);
      if (!startDate || startDate < today) continue;
      const endDate = String(item.end_date ?? startDate).slice(0, 10) || startDate;
      const chapter = item.chapter ?? {};
      const countryCode = String(chapter.country || '').trim();
      const country = String(chapter.country_name || countryCode || '').trim();
      const city = String(chapter.city || chapter.chapter_location || '').trim();
      const title = String(item.title || 'GDG Event').trim();
      const chapterDesc = String(chapter.description || '') + ' ' + String(chapter.title || '');
      const isGdgOnCampus = /gdg on campus|google developer student clubs|gdsc/i.test(chapterDesc);

      datedEvents.push({
        externalId: `bevy-${item.id}`,
        title,
        campaign: detectCampaign(title, String(item.event_type_title ?? '')),
        source: 'Live GDG',
        city,
        country,
        countryCode,
        startDate,
        endDate,
        url: String(item.url || 'https://gdg.community.dev'),
        isGdgOnCampus,
        chapterTitle: String(chapter.title || `GDG ${city || country}`),
      });
    }
  }

  if (sheetOutcome.status === 'fulfilled' && Array.isArray(sheetOutcome.value?.items)) {
    for (const raw of sheetOutcome.value.items as DiscoveredEvent[]) {
      if (raw.startDate) {
        datedEvents.push(raw);
      } else {
        recurringItems.push(raw);
      }
    }
  }

  const seen = new Set(datedEvents.map((e) => `${e.title.toLowerCase()}-${e.startDate}`));
  for (const fallback of OFFLINE_DEVFEST_FALLBACK) {
    if (!seen.has(`${fallback.title.toLowerCase()}-${fallback.startDate}`)) {
      datedEvents.push({ ...fallback, source: 'Live GDG' });
    }
  }

  datedEvents.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return [...datedEvents, ...recurringItems];
}

export interface AdvocuDraftOverrides {
  title?: string;
  description?: string;
  activityUrl?: string;
  attendees?: number;
  inPersonAttendees?: number;
  additionalInfo?: string;
}

const ADVOCU_CATEGORY_TAG_MAP: Record<string, string> = {
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

export function mapToAdvocuWriteTags(categories: readonly string[] = [], campaign?: string): string[] {
  const out = new Set<string>();
  for (const cat of categories) {
    const mapped = ADVOCU_CATEGORY_TAG_MAP[cat.trim()];
    if (mapped) out.add(mapped);
  }
  if (campaign) {
    const mappedCampaign = ADVOCU_CATEGORY_TAG_MAP[campaign.trim()];
    if (mappedCampaign) out.add(mappedCampaign);
  }
  return Array.from(out);
}

function formatAdvocuError(status: number, errText: string): string {
  try {
    const parsed = JSON.parse(errText) as {
      title?: string;
      detail?: string;
      details?: {
        title?: string;
        detail?: string;
        errors?: Array<string | { field?: string; property?: string; message?: string; defaultMessage?: string; reason?: string }>;
        violations?: Array<{ field?: string; message?: string }>;
      };
      errors?: Array<string | { field?: string; property?: string; message?: string; defaultMessage?: string }>;
    };
    const detailMsg = parsed.details?.detail || parsed.details?.title || parsed.detail || parsed.title || 'Validation failed';
    const rawErrors = parsed.details?.errors || parsed.details?.violations || parsed.errors || [];
    if (Array.isArray(rawErrors) && rawErrors.length > 0) {
      const formattedItems = rawErrors
        .map((item) => {
          if (typeof item === 'string') return item;
          const field = item.field || item.property || '';
          const msg = item.message || item.defaultMessage || item.reason || JSON.stringify(item);
          return field ? `${field}: ${msg}` : msg;
        })
        .join('; ');
      return `Advocu API returned ${status} (${detailMsg}): ${formattedItems}`;
    }
  } catch {
    // Fall through to raw text
  }
  return `Advocu API returned ${status}: ${errText.slice(0, 600)}`;
}

export function buildAdvocuPayload(
  event: GdeEvent,
  profile: GdeProfile,
  overrides: AdvocuDraftOverrides = {},
): Record<string, unknown> {
  const photosList = event.photos ?? [];
  const photoSummary = photosList.length
    ? `\n\nCaptured Event Photos (${photosList.length}): ` +
      photosList.map((p, idx) => `[${idx + 1}] ${p.caption || p.name}`).join('; ')
    : '';

  const rawUrl = (overrides.activityUrl ?? event.eventUrl ?? event.cfpUrl ?? '').trim();
  const activityUrl = /^https?:\/\//i.test(rawUrl)
    ? rawUrl.slice(0, 500)
    : rawUrl
      ? `https://${rawUrl}`.slice(0, 500)
      : 'https://gdg.community.dev';

  const attendees = Math.max(1, Math.round(Number(overrides.attendees ?? (event.expectedAudience || 60)) || 60));

  const rawTitle = (overrides.title || event.sessionTitle || event.title || 'GDE Session').trim();
  const safeTitle = (rawTitle.length < 3 ? `${rawTitle} Talk` : rawTitle).slice(0, 200);

  const eventFormat: 'In-Person' | 'Virtual' | 'Hybrid' =
    event.eventFormat === 'Virtual' || event.eventFormat === 'Hybrid' || event.eventFormat === 'In-Person'
      ? event.eventFormat
      : 'In-Person';

  const tags = mapToAdvocuWriteTags(profile.categories, event.campaign);

  const payload: Record<string, unknown> = {
    title: safeTitle,
    description: (
      overrides.description ||
      event.notes ||
      `${event.activityType} presented at ${event.title} (${event.city ? `${event.city}, ` : ''}${event.country})`
    ).slice(0, 2000),
    activityDate: event.startDate,
    ...(tags.length > 0 ? { tags } : {}),
    metrics: {
      attendees,
    },
    eventFormat,
    activityUrl,
    additionalInfo: (
      (overrides.additionalInfo ?? `GDE: ${profile.email} | Event: ${event.title}`) + photoSummary
    ).slice(0, 2000),
    private: false,
  };

  // Advocu API rule: `country` is accepted ONLY when `eventFormat` is `In-Person` or `Hybrid`.
  const cleanCountry = (event.country || '').trim();
  if (
    (eventFormat === 'In-Person' || eventFormat === 'Hybrid') &&
    cleanCountry &&
    !/^(online|virtual|remote)$/i.test(cleanCountry)
  ) {
    payload.country = cleanCountry.slice(0, 100);
  }

  // Advocu API rule: `inPersonAttendees` is accepted ONLY when `eventFormat` is `Hybrid`.
  if (eventFormat === 'Hybrid') {
    const rawInPerson = overrides.inPersonAttendees ?? attendees;
    payload.inPersonAttendees = Math.min(attendees, Math.max(0, Math.round(Number(rawInPerson) || 0)));
  }

  return payload;
}

export async function submitToAdvocu(
  event: GdeEvent,
  profile: GdeProfile,
  overrides: AdvocuDraftOverrides = {},
): Promise<{ ok: boolean; message: string; payload: Record<string, unknown> }> {
  const payload = buildAdvocuPayload(event, profile, overrides);
  const headerToken = sanitizeBearerHeaderToken(profile.advocuApiKey);
  if (!headerToken) {
    return {
      ok: false,
      message: 'Add your Advocu Personal API Key in Configuration first.',
      payload,
    };
  }

  const endpoint = event.activityType === 'Workshop' ? 'workshop' : 'public-speaking';

  try {
    const idToken = await getFirebaseIdToken();
    const res = await fetch(`/api/advocu/activity-drafts/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${headerToken}`,
        ...(idToken ? { 'X-Firebase-Id-Token': idToken } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        ok: false,
        message: formatAdvocuError(res.status, errText),
        payload,
      };
    }
    return {
      ok: true,
      message: `✅ Activity draft posted to Advocu (/activity-drafts/${endpoint})!`,
      payload,
    };
  } catch (err) {
    return {
      ok: false,
      message: `Network error: ${err instanceof Error ? err.message : String(err)}. You can also copy the prepared Advocu JSON below.`,
      payload,
    };
  }
}

export function compressEventPhoto(file: File, caption: string = ''): Promise<EventPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image format'));
      img.onload = () => {
        const maxDim = 800;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.76);
        resolve({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          dataUrl,
          caption: caption || file.name.replace(/\.[^.]+$/, ''),
          addedAt: new Date().toISOString().slice(0, 10),
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function parseSmartImport(
  rawText: string,
  profile: GdeProfile,
): Partial<GdeEvent> {
  const text = rawText.trim();
  const urls = Array.from(text.matchAll(/https?:\/\/[^\s)>"]+/gi)).map((m) => m[0]);
  const firstUrl = urls[0] || '';
  const secondUrl = urls[1] || '';

  let cfpPlatform: CfpPlatform = 'Other';
  if (/sessionize\.com/i.test(text)) cfpPlatform = 'Sessionize';
  else if (/advocu\.com/i.test(text)) cfpPlatform = 'Advocu';
  else if (/docs\.google\.com\/forms|forms\.gle/i.test(text)) cfpPlatform = 'Google Forms';
  else if (/gdg\.community\.dev|bevy/i.test(text)) cfpPlatform = 'Bevy / GDG';

  let cfpUrl = firstUrl;
  let eventUrl = secondUrl || firstUrl;
  if (secondUrl && /sessionize\.com|forms\.gle|docs\.google\.com\/forms/i.test(firstUrl)) {
    cfpUrl = firstUrl;
    eventUrl = secondUrl;
  } else if (secondUrl && /sessionize\.com|forms\.gle|docs\.google\.com\/forms/i.test(secondUrl)) {
    cfpUrl = secondUrl;
    eventUrl = firstUrl;
  }

  const isoDates = Array.from(text.matchAll(/\b(202\d-\d{2}-\d{2})\b/g)).map((m) => m[1]);
  const startDate = isoDates[0] || new Date().toISOString().slice(0, 10);
  const endDate = isoDates[1] && isoDates[1] >= startDate ? isoDates[1] : startDate;

  const isWorkTripsEmail = /worktrips\.com|gde travel tool|trip approval/i.test(text);
  const isApproved = /\bapproved\b/i.test(text);
  const hasFlight = /\bflight|airline|boarding|kiwi\b/i.test(text);
  const hasHotel = /\bhotel|accommodation|check-in|room\b/i.test(text);
  const refMatch = text.match(/(?:ref(?:erence)?|trip\s*id|booking\s*#?)[:\s#-]*([A-Z0-9-]{4,20})/i);

  let detectedCountry = profile.currentCountry || profile.homeCountry || 'Germany';
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const titleCandidate =
    lines.find((l) => !l.startsWith('http') && l.length > 4 && l.length < 100) ||
    (cfpPlatform === 'Sessionize' ? 'Sessionize CFP Event' : 'New GDE Event');

  if (/london|uk|united kingdom/i.test(text)) detectedCountry = 'United Kingdom';
  else if (/france|paris|nantes/i.test(text)) detectedCountry = 'France';
  else if (/spain|madrid|barcelona/i.test(text)) detectedCountry = 'Spain';
  else if (/italy|milan|rome/i.test(text)) detectedCountry = 'Italy';
  else if (/poland|warsaw|krakow/i.test(text)) detectedCountry = 'Poland';
  else if (/egypt|cairo/i.test(text)) detectedCountry = 'Egypt';
  else if (/kenya|nairobi/i.test(text)) detectedCountry = 'Kenya';
  else if (/nigeria|lagos/i.test(text)) detectedCountry = 'Nigeria';
  else if (/united states|usa|california|new york/i.test(text)) detectedCountry = 'United States';

  const departureCountry = profile.currentCountry || profile.homeCountry || 'Germany';
  const departureRegion = resolveRegion(
    departureCountry,
    profile.currentRegion || profile.homeRegion,
  );
  const region = resolveRegion(detectedCountry, departureRegion);
  const budgetUsd = calculateBudgetUsd(region, departureRegion, detectedCountry, departureCountry);

  return {
    title: titleCandidate,
    campaign: detectCampaign(text),
    country: detectedCountry,
    region,
    departureCountry,
    departureRegion,
    startDate,
    endDate,
    cfpPlatform,
    cfpUrl,
    eventUrl,
    budgetUsd,
    ...(isWorkTripsEmail
      ? {
          travelApprovalStatus: isApproved ? 'Approved' : 'Pending Approval',
          flightBooked: hasFlight && isApproved,
          hotelBooked: hasHotel && isApproved,
          worktripsRef: refMatch ? refMatch[1] : 'WORKTRIPS',
        }
      : {}),
  };
}

const MONTH_INDEX: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

function parseHumanDateToIso(str: string): string | null {
  const m = str.match(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),\s*(202\d)\b/i,
  );
  if (!m) return null;
  const mon = MONTH_INDEX[m[1].slice(0, 3).toLowerCase()];
  const day = m[2].padStart(2, '0');
  return `${m[3]}-${mon}-${day}`;
}

function inferCityAndCountryFromTitle(
  text: string,
  fallbackCountry: string,
): { city: string; country: string } {
  const t = text.toLowerCase();
  if (t.includes('trabzon')) return { city: 'Trabzon', country: 'Türkiye' };
  if (t.includes('krak') || t.includes('warsaw')) return { city: 'Kraków', country: 'Poland' };
  if (t.includes('mauritius')) return { city: 'Port Louis', country: 'Mauritius' };
  if (t.includes('almaty')) return { city: 'Almaty', country: 'Kazakhstan' };
  if (t.includes('ourense')) return { city: 'Ourense', country: 'Spain' };
  if (t.includes('madrid')) return { city: 'Madrid', country: 'Spain' };
  if (t.includes('barcelona')) return { city: 'Barcelona', country: 'Spain' };
  if (t.includes('paris')) return { city: 'Paris', country: 'France' };
  if (t.includes('nantes')) return { city: 'Nantes', country: 'France' };
  if (t.includes('london')) return { city: 'London', country: 'United Kingdom' };
  if (t.includes('berlin')) return { city: 'Berlin', country: 'Germany' };
  if (t.includes('frankfurt')) return { city: 'Frankfurt', country: 'Germany' };
  if (t.includes('vienna')) return { city: 'Vienna', country: 'Austria' };
  if (t.includes('cairo')) return { city: 'Cairo', country: 'Egypt' };
  if (t.includes('nairobi')) return { city: 'Nairobi', country: 'Kenya' };
  return { city: '', country: fallbackCountry || 'Germany' };
}

/**
 * Parses copied text from Advocu's "My Events" tab (tab=3), which lists CFP applications
 * with columns: Event title | Presentation title | Application date | Event date | Status (Accepted/Pending/Rejected).
 */
export function parseAdvocuMyEventsTable(rawText: string, profile: GdeProfile): GdeEvent[] {
  const results: GdeEvent[] = [];
  const rowRegex =
    /([^\n]+?)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s*202\d\s+((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s*202\d)\s+(Accepted|Pending|Rejected)/gi;

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        Boolean(l) &&
        !/^(Event title|Presentation title|Application date|Event date|Status|Action)$/i.test(l),
    );

  // Also support multi-line copy-paste where each row spans 3-6 lines ending in Accepted/Pending/Rejected
  const joined = lines.join('\n');
  const blocks = joined.split(/\n(?=(?:Accepted|Pending|Rejected)\b)/i);

  if (blocks.length > 1) {
    let prevLines: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^(Accepted|Pending|Rejected)$/i.test(line)) {
        const statusWord = line.toLowerCase();
        const status: EventStatus =
          statusWord === 'accepted'
            ? 'Confirmed'
            : statusWord === 'pending'
              ? 'Applied'
              : 'Declined';
        const dateLines = prevLines.filter((pl) => parseHumanDateToIso(pl) !== null);
        const nonDateLines = prevLines.filter((pl) => parseHumanDateToIso(pl) === null);
        const eventDateIso =
          (dateLines.length > 0
            ? parseHumanDateToIso(dateLines[dateLines.length - 1])
            : null) || new Date().toISOString().slice(0, 10);
        const evTitle = nonDateLines[0] || 'Advocu CFP Event';
        const sessionTitle = nonDateLines[nonDateLines.length - 1] || evTitle;
        const { city, country } = inferCityAndCountryFromTitle(
          `${evTitle} ${ nonDateLines.join(' ') }`,
          profile.homeCountry || 'Germany',
        );
        const depCountry = profile.currentCountry || profile.homeCountry || 'Germany';
        const depRegion = resolveRegion(depCountry, profile.homeRegion || 'Europe');
        const region = resolveRegion(country, depRegion);
        const slug = `${evTitle}-${sessionTitle}-${eventDateIso}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 64);

        results.push({
          id: `advocu-cfp-${slug}`,
          title: evTitle,
          campaign: detectCampaign(evTitle),
          city,
          country,
          region,
          startDate: eventDateIso,
          endDate: eventDateIso,
          status,
          cfpPlatform: 'Advocu',
          cfpUrl: 'https://app.advocu.com/',
          eventUrl: 'https://app.advocu.com/',
          sessionTitle,
          activityType: /workshop/i.test(evTitle + ' ' + sessionTitle) ? 'Workshop' : 'Talk',
          eventFormat: 'In-Person',
          expectedAudience: 250,
          isGdgOnCampus: false,
          budgetUsd: calculateBudgetUsd(region, depRegion, country, depCountry),
          worktripsRequested: false,
          worktripsApproved: false,
          worktripsTravelRequested: false,
          worktripsTravelApproved: false,
          budgetApproved: false,
          bookingMode: 'WorkTrips Direct',
          travelApprovalStatus: 'Not Submitted',
          flightBooked: false,
          hotelBooked: false,
          worktripsRef: '',
          reimbursementSubmitted: false,
          reimbursementSubmittedDate: '',
          reimbursementAmountUsd: 0,
          advocuSynced: false,
          photos: [],
          notes: `Imported from Advocu My Events (${line})`,
          updatedAt: new Date().toISOString(),
        });
        prevLines = [];
      } else {
        prevLines.push(line);
      }
    }
  }

  if (results.length === 0) {
    let match: RegExpExecArray | null;
    while ((match = rowRegex.exec(rawText)) !== null) {
      const lead = match[1].trim();
      const evDateIso = parseHumanDateToIso(match[3]) || new Date().toISOString().slice(0, 10);
      const statusWord = match[4].toLowerCase();
      const status: EventStatus =
        statusWord === 'accepted'
          ? 'Confirmed'
          : statusWord === 'pending'
            ? 'Applied'
            : 'Declined';
      const parts = lead.split(/\t|\s{2,}/).map((s) => s.trim()).filter(Boolean);
      const evTitle = parts[0] || lead;
      const sessionTitle = parts[parts.length - 1] || evTitle;
      const { city, country } = inferCityAndCountryFromTitle(
        lead,
        profile.homeCountry || 'Germany',
      );
      const depCountry = profile.currentCountry || profile.homeCountry || 'Germany';
      const depRegion = resolveRegion(depCountry, profile.homeRegion || 'Europe');
      const region = resolveRegion(country, depRegion);
      const slug = `${evTitle}-${sessionTitle}-${evDateIso}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 64);

      results.push({
        id: `advocu-cfp-${slug}`,
        title: evTitle,
        campaign: detectCampaign(evTitle),
        city,
        country,
        region,
        startDate: evDateIso,
        endDate: evDateIso,
        status,
        cfpPlatform: 'Advocu',
        cfpUrl: 'https://app.advocu.com/',
        eventUrl: 'https://app.advocu.com/',
        sessionTitle,
        activityType: /workshop/i.test(lead) ? 'Workshop' : 'Talk',
        eventFormat: 'In-Person',
        expectedAudience: 250,
        isGdgOnCampus: false,
        budgetUsd: calculateBudgetUsd(region, depRegion, country, depCountry),
        worktripsRequested: false,
        worktripsApproved: false,
        worktripsTravelRequested: false,
        worktripsTravelApproved: false,
        budgetApproved: false,
        bookingMode: 'WorkTrips Direct',
        travelApprovalStatus: 'Not Submitted',
        flightBooked: false,
        hotelBooked: false,
        worktripsRef: '',
        reimbursementSubmitted: false,
        reimbursementSubmittedDate: '',
        reimbursementAmountUsd: 0,
        advocuSynced: false,
        photos: [],
        notes: `Imported from Advocu My Events (${match[4]})`,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

export const GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Extracts Event Name, Start/End Date, City, Country, Campaign, CFP Platform, and Budget
 * automatically from an Event or CFP URL using Gemini 3.8 Flash on the backend + HTML/JSON-LD fallback.
 */
export interface ExtractedUrlEventResult {
  ok: boolean;
  aiDistilled: boolean;
  model: string;
  message: string;
  title: string;
  campaign: EventCampaign;
  city: string;
  country: string;
  region: GdeRegion;
  startDate: string;
  endDate: string;
  cfpPlatform: CfpPlatform;
  cfpUrl: string;
  eventUrl: string;
  budgetUsd: number;
}

export async function extractEventFromUrl(
  rawUrl: string,
  profile: GdeProfile,
): Promise<ExtractedUrlEventResult> {
  const url = rawUrl.trim().startsWith('http') ? rawUrl.trim() : `https://${rawUrl.trim()}`;
  const localParsed = parseSmartImport(url, profile);

  let title = localParsed.title || '';
  let startDate = localParsed.startDate || '';
  let endDate = localParsed.endDate || '';
  let city = '';
  let country = localParsed.country || '';
  let aiDistilled = false;
  let model = 'html-metadata';

  const lowerUrl = url.toLowerCase();
  let cfpPlatform: CfpPlatform = lowerUrl.includes('sessionize.com')
    ? 'Sessionize'
    : lowerUrl.includes('advocu.com')
      ? 'Advocu'
      : lowerUrl.includes('forms.gle') || lowerUrl.includes('docs.google.com/forms')
        ? 'Google Forms'
        : lowerUrl.includes('gdg.community.dev') || lowerUrl.includes('bevy')
          ? 'Bevy / GDG'
          : 'Other';
  let campaign: EventCampaign = detectCampaign(`${title} ${url}`);

  try {
    const resp = await fetch(`/api/advocu/extract-event?url=${encodeURIComponent(url)}`);
    if (resp.ok) {
      const data = await resp.json();
      const ext = data?.extracted || {};
      if (data?.aiDistilled) {
        aiDistilled = true;
        model = String(data.model || GEMINI_MODEL);
      }
      if (ext.title) title = String(ext.title).trim();
      if (ext.startDate) startDate = String(ext.startDate).trim();
      if (ext.endDate) endDate = String(ext.endDate).trim();
      if (ext.city) city = String(ext.city).trim();
      if (ext.country) country = String(ext.country).trim();
      if (ext.campaign) campaign = ext.campaign as EventCampaign;
      if (ext.cfpPlatform) cfpPlatform = ext.cfpPlatform as CfpPlatform;
    }
  } catch {
    // Fallback to client URL slug parsing
  }

  const homeCountry = profile.homeCountry || '';
  const inferredLoc = inferCityAndCountryFromTitle(
    `${title} ${city} ${country} ${url}`,
    homeCountry,
  );
  if (!city && inferredLoc.city) city = inferredLoc.city;
  if ((!country || country === homeCountry) && inferredLoc.city) {
    country = inferredLoc.country;
  }
  if (!country) {
    country = homeCountry;
  }

  const depCountry = profile.currentCountry || homeCountry;
  const depRegion = resolveRegion(depCountry, profile.homeRegion || 'Europe');
  const region = resolveRegion(country, depRegion);
  const budgetUsd = calculateBudgetUsd(region, depRegion, country, depCountry);
  if (!campaign) {
    campaign = detectCampaign(`${title} ${url}`);
  }

  const finalTitle = title || 'GDE Event';
  const finalStart = startDate || new Date().toISOString().slice(0, 10);
  const finalEnd = endDate || finalStart;
  const locSummary = [city, country].filter(Boolean).join(', ');

  return {
    ok: Boolean(title || startDate || city),
    aiDistilled,
    model,
    message: `Auto-filled: ${finalTitle} (${locSummary || region} · $${budgetUsd} USD)`,
    title: finalTitle,
    campaign,
    city,
    country,
    region,
    startDate: finalStart,
    endDate: finalEnd,
    cfpPlatform,
    cfpUrl: url,
    eventUrl: url,
    budgetUsd,
  };
}

/**
 * Returns unique Talk / Session titles from the GDE's Advocu Speaker Matching (My Events)
 * and Advocu Activity history so Step 2 in Add Event can offer instant autocomplete & 1-click chips.
 */
export function getSpeakerMatchingSessions(events: GdeEvent[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  const addIfValid = (raw?: string) => {
    const t = String(raw || '').trim();
    if (!t || t.length < 4) return;
    if (/^(GDE Event|Imported Event|Talk|Session|Click Edit)/i.test(t)) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    ordered.push(t);
  };

  // 1. Prioritize active / Speaker Matching CFP session titles first
  for (const ev of events) {
    if (ev.status !== 'Completed' && ev.sessionTitle && ev.sessionTitle !== ev.title) {
      addIfValid(ev.sessionTitle);
    }
  }

  // 2. Then include session titles from all Advocu events/activities
  for (const ev of events) {
    if (ev.sessionTitle) {
      addIfValid(ev.sessionTitle);
    }
  }

  return ordered.slice(0, 12);
}


