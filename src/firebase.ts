import { initializeApp } from 'firebase/app';
import {
  deleteUser,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInAnonymously,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  DEFAULT_GDE_PROFILE,
  type GdeEvent,
  type GdeProfile,
  generateComedicParticipantName,
  isMaskedAdvocuKey,
  isValidPulseImageUrl,
  MASKED_ADVOCU_KEY,
  type PulseAnswerRecord,
  type PulseParticipant,
  type PulseQuiz,
  sanitizeBearerHeaderToken,
} from './policy.ts';

export { MASKED_ADVOCU_KEY };

const env =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env ??
  (typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {});

const firebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'andresara',
  appId: env.VITE_FIREBASE_APP_ID || '1:951871417017:web:e1bcc68f85804d96598968',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'andresara.firebasestorage.app',
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'gde.web.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '951871417017',
};

const app = initializeApp(firebaseConfig);
export const auth = (() => {
  try {
    return getAuth(app);
  } catch {
    return { currentUser: null } as unknown as ReturnType<typeof getAuth>;
  }
})();
export const db = getFirestore(app);

const LS_SESSION_KEY = 'gde_planner_session_v5';
const profileKeyFor = (uid: string) => `gde_planner_profile_v5_${uid}`;
const eventsKeyFor = (uid: string) => `gde_planner_events_v5_${uid}`;

export const SEED_EVENTS: GdeEvent[] = [];

export interface AuthSession {
  uid: string;
  email: string;
  displayName: string;
  isCloud: boolean;
}

let sessionListener: ((user: AuthSession | null) => void) | null = null;

export async function getFirebaseIdToken(): Promise<string> {
  try {
    return auth.currentUser ? await auth.currentUser.getIdToken() : '';
  } catch {
    return '';
  }
}

export async function syncEncryptedAdvocuKeyToServer(rawKey: string): Promise<string> {
  const trimmed = (rawKey || '').trim();
  if (isMaskedAdvocuKey(trimmed)) {
    return MASKED_ADVOCU_KEY;
  }
  const clean = sanitizeBearerHeaderToken(trimmed);
  const idToken = await getFirebaseIdToken();
  if (!idToken) {
    throw new Error('Sign in with Google to save or update your Advocu API key.');
  }
  const res = await fetch('/api/advocu/key', {
    method: clean ? 'POST' : 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-Firebase-Id-Token': idToken,
    },
    body: clean ? JSON.stringify({ advocuApiKey: clean }) : undefined,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      String(errBody?.error || `Failed to save Advocu key (HTTP ${res.status}). Please retry.`),
    );
  }
  const data = await res.json();
  return data?.hasKey ? MASKED_ADVOCU_KEY : '';
}

export function loadLocalProfile(uid: string = 'default'): GdeProfile {
  try {
    const raw = localStorage.getItem(profileKeyFor(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_GDE_PROFILE,
        ...parsed,
        advocuApiKey: isMaskedAdvocuKey(parsed?.advocuApiKey) ? MASKED_ADVOCU_KEY : '',
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_GDE_PROFILE, advocuApiKey: '' };
}

export function saveLocalProfile(uid: string, profile: GdeProfile): void {
  const scrubbed: GdeProfile = {
    ...profile,
    advocuApiKey: isMaskedAdvocuKey(profile.advocuApiKey) ? MASKED_ADVOCU_KEY : '',
  };
  localStorage.setItem(profileKeyFor(uid), JSON.stringify(scrubbed));
}

export function loadLocalEvents(uid: string = 'default'): GdeEvent[] {
  try {
    const raw = localStorage.getItem(eventsKeyFor(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((e) => !String(e?.id || '').startsWith('seed-'));
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalEvents(uid: string, events: GdeEvent[]): void {
  localStorage.setItem(eventsKeyFor(uid), JSON.stringify(events));
}

export async function signInWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export function getSavedSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(LS_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    const prefix = 'gde_planner_profile_v5_';
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith(prefix) && key !== 'gde_planner_profile_v5_default') {
        const uid = key.slice(prefix.length);
        const profRaw = localStorage.getItem(key);
        if (uid && profRaw) {
          const prof = JSON.parse(profRaw);
          if (prof?.configured && prof?.email) {
            return {
              uid,
              email: String(prof.email),
              displayName: String(prof.displayName || prof.email.split('@')[0] || 'GDE'),
              isCloud: true,
            };
          }
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  try {
    localStorage.removeItem(LS_SESSION_KEY);
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('gde_planner_') && key !== 'gde_planner_theme_v1') {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
  try {
    await fbSignOut(auth);
  } catch {
    // ignore
  }
  if (sessionListener) sessionListener(null);
}

export function watchAuth(cb: (user: AuthSession | null) => void): () => void {
  sessionListener = cb;
  return onAuthStateChanged(auth, (fbUser) => {
    if (fbUser && !fbUser.isAnonymous) {
      const session: AuthSession = {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName:
          fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'GDE'),
        isCloud: true,
      };
      try {
        localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session));
      } catch {
        // ignore
      }
      cb(session);
      return;
    }
    try {
      localStorage.removeItem(LS_SESSION_KEY);
    } catch {
      // ignore
    }
    cb(null);
  });
}

export async function fetchOrCreateCloudProfile(
  session: AuthSession,
): Promise<{ profile: GdeProfile; isConfigured: boolean }> {
  const local = loadLocalProfile(session.uid);

  if (!session.isCloud) {
    const merged: GdeProfile = {
      ...DEFAULT_GDE_PROFILE,
      ...local,
      email: local.email || session.email,
      sessionizeEmail: local.sessionizeEmail || '',
      displayName: local.displayName || session.displayName,
    };
    saveLocalProfile(session.uid, merged);
    return {
      profile: merged,
      isConfigured: Boolean(merged.configured),
    };
  }

  const ref = doc(db, 'gde_users', session.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as Partial<GdeProfile>;
      const isConfigured = Boolean(data.configured);
      const rawCloudKey = String(data.advocuApiKey || '').trim();

      const merged: GdeProfile = {
        ...DEFAULT_GDE_PROFILE,
        ...(isConfigured ? data : {}),
        email: session.email || data.email || '',
        sessionizeEmail: isConfigured ? data.sessionizeEmail || '' : '',
        displayName: (isConfigured && data.displayName) || session.displayName,
        homeCountry: isConfigured ? data.homeCountry || '' : '',
        currentCountry: isConfigured ? data.currentCountry || data.homeCountry || '' : '',
        categories: isConfigured && Array.isArray(data.categories) ? data.categories : [],
        advocuApiKey: rawCloudKey ? MASKED_ADVOCU_KEY : '',
        avatarUrl: data.avatarUrl || local.avatarUrl || '',
        organization: data.organization || local.organization || '',
        bio: data.bio || local.bio || '',
        location: data.location || local.location || '',
        gdeProfileUrl: data.gdeProfileUrl || local.gdeProfileUrl || '',
        specializations: data.specializations || local.specializations || [],
        agentTokenHash: data.agentTokenHash || local.agentTokenHash || '',
        travelPlannerEnabled:
          data.travelPlannerEnabled ?? local.travelPlannerEnabled ?? true,
        configured: isConfigured,
      };
      saveLocalProfile(session.uid, merged);
      return {
        profile: merged,
        isConfigured,
      };
    }
    const initial: GdeProfile = {
      ...DEFAULT_GDE_PROFILE,
      email: session.email,
      sessionizeEmail: '',
      displayName: session.displayName,
      homeCountry: '',
      currentCountry: '',
      categories: [],
      advocuApiKey: '',
      configured: false,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(ref, initial);
    saveLocalProfile(session.uid, initial);
    return { profile: initial, isConfigured: false };
  } catch {
    return {
      profile: local,
      isConfigured: Boolean(local.configured),
    };
  }
}

export async function persistProfile(
  session: AuthSession | null,
  profile: GdeProfile,
): Promise<void> {
  const uid = session?.uid || 'default';
  const rawKey = (profile.advocuApiKey || '').trim();
  let maskedOrEmpty = '';

  if (session?.isCloud && auth.currentUser?.uid === session.uid) {
    maskedOrEmpty = await syncEncryptedAdvocuKeyToServer(rawKey);
  } else if (isMaskedAdvocuKey(rawKey)) {
    maskedOrEmpty = MASKED_ADVOCU_KEY;
  }

  profile.advocuApiKey = maskedOrEmpty;
  const updated: GdeProfile = {
    ...profile,
    advocuApiKey: maskedOrEmpty,
    configured: true,
    updatedAt: new Date().toISOString(),
  };
  saveLocalProfile(uid, updated);
  if (session?.isCloud && auth.currentUser?.uid === session.uid) {
    const firestorePayload: Record<string, unknown> = {
      email: updated.email,
      sessionizeEmail: updated.sessionizeEmail,
      displayName: updated.displayName,
      homeCountry: updated.homeCountry,
      homeRegion: updated.homeRegion,
      currentCountry: updated.currentCountry,
      currentRegion: updated.currentRegion,
      categories: updated.categories,
      advocuApiKey: maskedOrEmpty,
      sessionizeSpeakerId: updated.sessionizeSpeakerId,
      preferredCurrency: updated.preferredCurrency,
      avatarUrl: updated.avatarUrl || '',
      organization: updated.organization || '',
      bio: updated.bio || '',
      location: updated.location || '',
      gdeProfileUrl: updated.gdeProfileUrl || '',
      specializations: updated.specializations || [],
      agentTokenHash: updated.agentTokenHash || '',
      travelPlannerEnabled: updated.travelPlannerEnabled ?? true,
      configured: updated.configured,
      updatedAt: updated.updatedAt,
    };
    await setDoc(doc(db, 'gde_users', session.uid), firestorePayload, { merge: true });
  }
}

export async function persistDirectoryEnrichment(
  session: AuthSession | null,
  profile: GdeProfile,
): Promise<void> {
  if (!session) return;
  saveLocalProfile(session.uid, profile);
  if (session.isCloud && auth.currentUser?.uid === session.uid) {
    try {
      await setDoc(
        doc(db, 'gde_users', session.uid),
        {
          avatarUrl: profile.avatarUrl || '',
          organization: profile.organization || '',
          bio: profile.bio || '',
          location: profile.location || '',
          gdeProfileUrl: profile.gdeProfileUrl || '',
          specializations: profile.specializations || [],
          homeCountry: profile.homeCountry || '',
          homeRegion: profile.homeRegion || 'Europe',
          currentCountry: profile.currentCountry || '',
          currentRegion: profile.currentRegion || 'Europe',
          categories: profile.categories || [],
        },
        { merge: true },
      );
    } catch {
      // ignore background enrichment write errors
    }
  }
}

function sanitizeEventForFirestore(ev: GdeEvent): GdeEvent {
  const raw: GdeEvent = {
    ...ev,
    title: (ev.title || 'GDE Event').slice(0, 300),
    country: (ev.country || 'Online').slice(0, 100),
    region: ev.region || 'Europe',
    startDate: ev.startDate || new Date().toISOString().slice(0, 10),
    endDate: ev.endDate || ev.startDate || new Date().toISOString().slice(0, 10),
    status: ev.status || 'Considering',
  };
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v !== undefined) {
      cleaned[k] = v;
    }
  }
  return cleaned as unknown as GdeEvent;
}

export function subscribeEvents(
  session: AuthSession | null,
  onEvents: (events: GdeEvent[]) => void,
): () => void {
  const uid = session?.uid || 'default';
  const initialLocal = loadLocalEvents(uid);
  if (initialLocal.length > 0) {
    onEvents(initialLocal);
  }
  if (!session?.isCloud) {
    if (initialLocal.length === 0) onEvents(initialLocal);
    return () => {};
  }

  const colRef = collection(db, 'gde_users', session.uid, 'events');
  return onSnapshot(
    colRef,
    async (snap) => {
      const local = loadLocalEvents(uid);
      if (snap.empty) {
        onEvents(local);
        return;
      }
      const byId = new Map<string, GdeEvent>();
      for (const l of local) {
        if (!String(l.id || '').startsWith('seed-')) {
          byId.set(l.id, l);
        }
      }
      snap.forEach((d) => {
        const data = d.data() as GdeEvent;
        const id = data.id || d.id;
        if (String(id).startsWith('seed-')) return;
        const existingLocal = byId.get(id);
        if (
          existingLocal &&
          existingLocal.updatedAt &&
          data.updatedAt &&
          existingLocal.updatedAt > data.updatedAt
        ) {
          // Keep the newer local edit while Firestore sync catches up
          return;
        }
        byId.set(id, data);
      });
      const list = Array.from(byId.values()).sort((a, b) =>
        b.startDate.localeCompare(a.startDate),
      );
      saveLocalEvents(uid, list);
      onEvents(list);
    },
    () => {
      onEvents(loadLocalEvents(uid));
    },
  );
}

export async function upsertEvent(
  session: AuthSession | null,
  event: GdeEvent,
): Promise<GdeEvent[]> {
  return upsertEventsBatch(session, [event], { preserveExisting: false });
}

export async function upsertEventsBatch(
  session: AuthSession | null,
  incomingEvents: GdeEvent[],
  options: { preserveExisting?: boolean } = {},
): Promise<GdeEvent[]> {
  const uid = session?.uid || 'default';
  const nowIso = new Date().toISOString();
  const current = loadLocalEvents(uid);
  const byId = new Map<string, GdeEvent>(current.map((e) => [e.id, e]));

  const sanitizedList: GdeEvent[] = [];
  for (const raw of incomingEvents) {
    if (options.preserveExisting && byId.has(raw.id)) {
      continue;
    }
    const clean = sanitizeEventForFirestore({ ...raw, updatedAt: nowIso });
    byId.set(clean.id, clean);
    sanitizedList.push(clean);
  }

  const next = Array.from(byId.values()).sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );
  saveLocalEvents(uid, next);

  if (session?.isCloud && sanitizedList.length > 0) {
    await Promise.all(
      sanitizedList.map((ev) =>
        setDoc(doc(db, 'gde_users', session.uid, 'events', ev.id), ev).catch((err) => {
          console.warn('Firestore event upsert fallback to local:', err);
        }),
      ),
    );
  }
  return next;
}

export async function removeEvent(
  session: AuthSession | null,
  eventId: string,
): Promise<GdeEvent[]> {
  const uid = session?.uid || 'default';
  const next = loadLocalEvents(uid).filter((e) => e.id !== eventId);
  saveLocalEvents(uid, next);
  if (session?.isCloud) {
    try {
      await deleteDoc(doc(db, 'gde_users', session.uid, 'events', eventId));
    } catch (err) {
      console.warn('Firestore event delete fallback to local:', err);
    }
  }
  return next;
}

export async function deleteUserAccountAndData(session: AuthSession | null): Promise<void> {
  const uid = session?.uid || auth.currentUser?.uid || 'default';

  // 1. Atomically delete server-encrypted Advocu secret, all Firestore events, and profile document via server recursiveDelete
  if (session?.isCloud && uid !== 'default') {
    const idToken = await getFirebaseIdToken();
    if (!idToken) {
      throw new Error('Authentication required to delete cloud profile and stored secrets.');
    }
    const delResp = await fetch('/api/advocu/profile', {
      method: 'DELETE',
      headers: { 'X-Firebase-Id-Token': idToken },
    });
    if (!delResp.ok) {
      const errBody = await delResp.json().catch(() => ({}));
      throw new Error(
        String(errBody?.error || `Failed to delete cloud profile (HTTP ${delResp.status}).`),
      );
    }
  }

  // 2. Purge all local storage entries for this user and app
  try {
    localStorage.removeItem(LS_SESSION_KEY);
    localStorage.removeItem(profileKeyFor(uid));
    localStorage.removeItem(eventsKeyFor(uid));
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('gde_planner_')) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }

  // 3. Delete the Firebase Authentication user record (re-authenticating if needed)
  const fbUser = auth.currentUser;
  if (fbUser) {
    try {
      await deleteUser(fbUser);
    } catch (err: any) {
      if (err?.code === 'auth/requires-recent-login') {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await reauthenticateWithPopup(fbUser, provider);
        await deleteUser(fbUser);
      } else {
        await fbSignOut(auth).catch(() => {});
      }
    }
  }

  try {
    await fbSignOut(auth);
  } catch {
    // ignore
  }

  if (sessionListener) sessionListener(null);
}

const agentTokenKeyFor = (uid: string) => `gde_planner_agent_token_v1_${uid}`;

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getSavedAgentToken(uid: string): string {
  try {
    return localStorage.getItem(agentTokenKeyFor(uid)) || '';
  } catch {
    return '';
  }
}

export async function generatePersonalAgentToken(
  session: AuthSession | null,
  currentProfile: GdeProfile,
): Promise<{ rawToken: string; updatedProfile: GdeProfile }> {
  const uid = session?.uid || auth.currentUser?.uid || 'default';
  const randBytes = new Uint8Array(18);
  crypto.getRandomValues(randBytes);
  const randHex = Array.from(randBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const rawToken = `gde_pat_${uid}_${randHex}`;
  const hash = await sha256Hex(rawToken);

  try {
    localStorage.setItem(agentTokenKeyFor(uid), rawToken);
  } catch {
    // ignore
  }

  const updatedProfile: GdeProfile = {
    ...currentProfile,
    agentTokenHash: hash,
    updatedAt: new Date().toISOString(),
  };
  await persistProfile(session, updatedProfile);
  return { rawToken, updatedProfile };
}

export async function revokePersonalAgentToken(
  session: AuthSession | null,
  currentProfile: GdeProfile,
): Promise<GdeProfile> {
  const uid = session?.uid || auth.currentUser?.uid || 'default';
  try {
    localStorage.removeItem(agentTokenKeyFor(uid));
  } catch {
    // ignore
  }
  const updatedProfile: GdeProfile = {
    ...currentProfile,
    agentTokenHash: '',
    updatedAt: new Date().toISOString(),
  };
  await persistProfile(session, updatedProfile);
  return updatedProfile;
}

// ============================================================================
// GDE PULSE LIVE QUIZ — FIRESTORE & ANONYMOUS PARTICIPANT AUTH
// ============================================================================
const quizzesKeyFor = (uid: string) => `gde_pulse_quizzes_v1_${uid}`;
const LS_PARTICIPANT_UID_KEY = 'gde_pulse_participant_uid_v1';
const LS_PARTICIPANT_NAME_KEY = 'gde_pulse_participant_name_v1';

export function loadLocalQuizzes(uid: string = 'default'): PulseQuiz[] {
  try {
    const raw = localStorage.getItem(quizzesKeyFor(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveLocalQuizzes(uid: string, quizzes: PulseQuiz[]): void {
  try {
    localStorage.setItem(quizzesKeyFor(uid), JSON.stringify(quizzes));
  } catch {
    // ignore
  }
}

export function getSavedParticipantName(): string {
  try {
    return localStorage.getItem(LS_PARTICIPANT_NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveParticipantName(name: string): void {
  try {
    localStorage.setItem(LS_PARTICIPANT_NAME_KEY, name);
  } catch {
    // ignore
  }
}

export async function ensureParticipantAuth(): Promise<string> {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  try {
    const cred = await signInAnonymously(auth);
    return cred.user.uid;
  } catch {
    let fallbackUid = '';
    try {
      fallbackUid = localStorage.getItem(LS_PARTICIPANT_UID_KEY) || '';
      if (!fallbackUid) {
        fallbackUid = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        localStorage.setItem(LS_PARTICIPANT_UID_KEY, fallbackUid);
      }
    } catch {
      fallbackUid = `anon_${Date.now()}`;
    }
    return fallbackUid;
  }
}

export function subscribeHostQuizzes(
  session: AuthSession | null,
  onQuizzes: (quizzes: PulseQuiz[]) => void,
): () => void {
  const uid = session?.uid || 'default';
  const initial = loadLocalQuizzes(uid);
  if (initial.length > 0) {
    onQuizzes(initial);
  }
  if (!session?.isCloud) {
    if (initial.length === 0) onQuizzes(initial);
    return () => {};
  }

  const q = query(collection(db, 'pulse_quizzes'), where('ownerUid', '==', session.uid));
  return onSnapshot(
    q,
    (snap) => {
      const local = loadLocalQuizzes(uid);
      const byId = new Map<string, PulseQuiz>(local.map((item) => [item.id, item]));
      snap.forEach((d) => {
        const data = d.data() as PulseQuiz;
        byId.set(data.id || d.id, { ...data, id: data.id || d.id });
      });
      const list = Array.from(byId.values()).sort((a, b) =>
        (b.updatedAt || '').localeCompare(a.updatedAt || ''),
      );
      saveLocalQuizzes(uid, list);
      onQuizzes(list);
    },
    () => {
      onQuizzes(loadLocalQuizzes(uid));
    },
  );
}

export async function upsertPulseQuiz(
  session: AuthSession | null,
  quiz: PulseQuiz,
): Promise<PulseQuiz[]> {
  const uid = session?.uid || 'default';
  const nowIso = new Date().toISOString();
  const cleanQuiz: PulseQuiz = {
    id: quiz.id,
    ownerUid: session?.uid || quiz.ownerUid || 'default',
    ownerName: quiz.ownerName || session?.displayName || 'GDE',
    title: (quiz.title || 'Live Workshop Quiz').slice(0, 300),
    code: (quiz.code || 'PULSE').toUpperCase().slice(0, 20),
    status: quiz.status || 'draft',
    isActive: Boolean(quiz.isActive),
    currentQuestionIndex:
      typeof quiz.currentQuestionIndex === 'number' ? quiz.currentQuestionIndex : -1,
    questionStartedAt: quiz.questionStartedAt || 0,
    questions: (quiz.questions || []).slice(0, 50).map((q) => ({
      id: q.id,
      prompt: (q.prompt || '').slice(0, 500),
      imageUrl: isValidPulseImageUrl(q.imageUrl) ? q.imageUrl!.trim() : '',
      options: (q.options || []).slice(0, 6).map((o) => String(o || '').slice(0, 240)),
      correctIndex: Number(q.correctIndex) || 0,
      timeLimitSec: q.timeLimitSec || 15,
    })),
    createdAt: quiz.createdAt || nowIso,
    updatedAt: nowIso,
  };

  const current = loadLocalQuizzes(uid);
  const byId = new Map<string, PulseQuiz>(current.map((item) => [item.id, item]));
  if (cleanQuiz.isActive) {
    for (const [id, existing] of byId.entries()) {
      if (id !== cleanQuiz.id && existing.isActive) {
        const deactivated = { ...existing, isActive: false, updatedAt: nowIso };
        byId.set(id, deactivated);
        if (session?.isCloud) {
          void setDoc(doc(db, 'pulse_quizzes', id), deactivated).catch(() => {});
        }
      }
    }
  }
  byId.set(cleanQuiz.id, cleanQuiz);
  const next = Array.from(byId.values()).sort((a, b) =>
    (b.updatedAt || '').localeCompare(a.updatedAt || ''),
  );
  saveLocalQuizzes(uid, next);

  if (session?.isCloud) {
    await setDoc(doc(db, 'pulse_quizzes', cleanQuiz.id), cleanQuiz).catch((err) => {
      console.warn('Firestore quiz upsert fallback to local:', err);
    });
  }
  return next;
}

export async function deletePulseQuiz(
  session: AuthSession | null,
  quizId: string,
): Promise<PulseQuiz[]> {
  const uid = session?.uid || 'default';
  const next = loadLocalQuizzes(uid).filter((q) => q.id !== quizId);
  saveLocalQuizzes(uid, next);
  if (session?.isCloud) {
    try {
      const partSnap = await getDocs(collection(db, 'pulse_quizzes', quizId, 'participants'));
      await Promise.all(partSnap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
      await deleteDoc(doc(db, 'pulse_quizzes', quizId));
    } catch (err) {
      console.warn('Firestore quiz delete fallback to local:', err);
    }
  }
  return next;
}

export function subscribeQuizParticipants(
  quizId: string,
  onParticipants: (participants: PulseParticipant[]) => void,
): () => void {
  const colRef = collection(db, 'pulse_quizzes', quizId, 'participants');
  return onSnapshot(
    colRef,
    (snap) => {
      const list: PulseParticipant[] = [];
      snap.forEach((d) => {
        const data = d.data() as PulseParticipant;
        list.push({ ...data, uid: data.uid || d.id });
      });
      list.sort((a, b) => b.score - a.score || (a.joinedAt || '').localeCompare(b.joinedAt || ''));
      onParticipants(list);
    },
    () => {
      onParticipants([]);
    },
  );
}

export function subscribeLiveQuizForParticipant(
  codeOrQuizId: string,
  onQuiz: (quiz: PulseQuiz | null) => void,
): () => void {
  const trimmed = (codeOrQuizId || '').trim();
  if (!trimmed) {
    onQuiz(null);
    return () => {};
  }

  const upper = trimmed.toUpperCase();
  const q = query(collection(db, 'pulse_quizzes'), where('code', '==', upper));

  return onSnapshot(
    q,
    (snap) => {
      const matches: PulseQuiz[] = [];
      snap.forEach((d) => {
        const data = d.data() as PulseQuiz;
        matches.push({ ...data, id: data.id || d.id });
      });
      matches.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
      onQuiz(matches[0] || null);
    },
    () => {
      onQuiz(null);
    },
  );
}

export async function joinPulseQuizQueue(
  quizId: string,
  rawName: string,
): Promise<PulseParticipant> {
  const uid = await ensureParticipantAuth();
  const cleanName = (rawName || '').trim().slice(0, 50) || generateComedicParticipantName();
  saveParticipantName(cleanName);

  const nowIso = new Date().toISOString();
  const ref = doc(db, 'pulse_quizzes', quizId, 'participants', uid);
  try {
    const existing = await getDoc(ref);
    if (existing.exists()) {
      const data = existing.data() as PulseParticipant;
      const updated: PulseParticipant = {
        uid,
        name: cleanName,
        score: typeof data.score === 'number' ? data.score : 0,
        correctCount: typeof data.correctCount === 'number' ? data.correctCount : 0,
        answers: data.answers || {},
        lastAnsweredIndex:
          typeof data.lastAnsweredIndex === 'number' ? data.lastAnsweredIndex : -1,
        lastSelectedIndex:
          typeof data.lastSelectedIndex === 'number' ? data.lastSelectedIndex : -1,
        joinedAt: data.joinedAt || nowIso,
        updatedAt: nowIso,
      };
      await setDoc(ref, updated);
      return updated;
    }
  } catch {
    // ignore read error before create
  }

  const participant: PulseParticipant = {
    uid,
    name: cleanName,
    score: 0,
    correctCount: 0,
    answers: {},
    lastAnsweredIndex: -1,
    lastSelectedIndex: -1,
    joinedAt: nowIso,
    updatedAt: nowIso,
  };
  await setDoc(ref, participant);
  return participant;
}

export async function submitPulseQuizAnswer(
  quizId: string,
  participant: PulseParticipant,
  questionIndex: number,
  selectedIndex: number,
  points: number,
  isCorrect: boolean,
): Promise<PulseParticipant> {
  const uid = participant.uid || (await ensureParticipantAuth());
  const qKey = String(questionIndex);
  const existingAnswers = { ...(participant.answers || {}) };
  if (existingAnswers[qKey]) {
    return participant; // Already answered this question
  }

  const record: PulseAnswerRecord = {
    selectedIndex,
    answeredAtMs: Date.now(),
    points,
    correct: isCorrect,
  };
  existingAnswers[qKey] = record;

  let totalScore = 0;
  let totalCorrect = 0;
  for (const ans of Object.values(existingAnswers)) {
    totalScore += Number(ans.points) || 0;
    if (ans.correct) totalCorrect += 1;
  }

  const updated: PulseParticipant = {
    uid,
    name: participant.name,
    score: totalScore,
    correctCount: totalCorrect,
    answers: existingAnswers,
    lastAnsweredIndex: questionIndex,
    lastSelectedIndex: selectedIndex,
    joinedAt: participant.joinedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'pulse_quizzes', quizId, 'participants', uid), updated);
  return updated;
}

export async function clearPulseQuizParticipants(quizId: string): Promise<void> {
  try {
    const snap = await getDocs(collection(db, 'pulse_quizzes', quizId, 'participants'));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
  } catch (err) {
    console.warn('Could not clear quiz participants:', err);
  }
}


