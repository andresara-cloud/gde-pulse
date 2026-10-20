import {
  type AuthSession,
  deleteUserAccountAndData,
  fetchOrCreateCloudProfile,
  generatePersonalAgentToken,
  getSavedAgentToken,
  getSavedSession,
  loadLocalEvents,
  loadLocalProfile,
  persistDirectoryEnrichment,
  persistProfile,
  removeEvent,
  revokePersonalAgentToken,
  signInWithGoogle,
  signOutUser,
  subscribeEvents,
  upsertEventsBatch,
  watchAuth,
} from './firebase.ts';
import { executeLockedSql } from './sqlEngine.ts';
import {
  fetchGdeDirectoryProfile,
  syncFromAdvocuKey,
} from './integrations.ts';
import {
  DEFAULT_ANDRES_PROFILE,
  type GdeCategory,
  type GdeEvent,
  type GdeProfile,
  type GdeRegion,
  resolveRegion,
} from './policy.ts';
import {
  bindPulseHostSession,
  initParticipantPortal,
  initPulseHostModule,
  isParticipantPortal,
  renderPulseHostModule,
} from './pulseQuiz.ts';
import {
  initTravelPlannerModule,
  openEventModal,
  renderKpisAndItinerary,
  renderTravelPlanner,
} from './travelPlanner.ts';

let currentSession: AuthSession | null = null;
let currentProfile: GdeProfile = { ...DEFAULT_ANDRES_PROFILE };
let events: GdeEvent[] = [];
let unsubscribeEvents: (() => void) | null = null;
let activeWorkspaceModule: 'pulse' | 'travel' = 'pulse';

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

function showToast(msg: string): void {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  window.setTimeout(() => {
    el.hidden = true;
  }, 3400);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderGdeDirectoryCards(profile: GdeProfile): void {
  const hasDirectoryInfo = Boolean(
    profile.avatarUrl ||
      profile.bio ||
      profile.organization ||
      profile.location ||
      (profile.specializations && profile.specializations.length > 0),
  );

  const badges =
    profile.specializations && profile.specializations.length > 0
      ? profile.specializations
      : profile.categories || [];

  const cardHtml = `
    <div class="gde-dir-inner">
      ${
        profile.avatarUrl
          ? `<img src="${escapeHtml(profile.avatarUrl)}" alt="${escapeHtml(profile.displayName || 'GDE')}" class="gde-dir-avatar" referrerpolicy="no-referrer" />`
          : `<div class="gde-dir-avatar gde-dir-avatar-fallback">GDE</div>`
      }
      <div class="gde-dir-body">
        <div class="gde-dir-title-row">
          <div>
            <h2 class="gde-dir-name">
              ${escapeHtml(profile.displayName || 'Google Developer Expert')}
              ${profile.organization ? `<span class="gde-dir-org">&middot; ${escapeHtml(profile.organization)}</span>` : ''}
            </h2>
            <div class="gde-dir-meta">
              ${profile.location || profile.homeCountry ? `<span>📍 ${escapeHtml(profile.location || profile.homeCountry)}</span>` : ''}
              ${profile.homeRegion ? `<span>&middot; Region: <strong>${escapeHtml(profile.homeRegion)}</strong></span>` : ''}
              ${profile.email ? `<span>&middot; ${escapeHtml(profile.email)}</span>` : ''}
            </div>
          </div>
          ${
            profile.gdeProfileUrl
              ? `<div class="gde-dir-actions">
                  <a href="${escapeHtml(profile.gdeProfileUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">GDE Directory Profile &nearr;</a>
                </div>`
              : ''
          }
        </div>
        ${
          badges.length > 0
            ? `<div class="gde-dir-badges">${badges
                .map((b) => `<span class="chip chip-blue">${escapeHtml(b)}</span>`)
                .join('')}</div>`
            : ''
        }
        ${profile.bio ? `<p class="gde-dir-bio">${escapeHtml(profile.bio)}</p>` : ''}
      </div>
    </div>
  `;

  const modalEl = document.getElementById('modalGdeDirectoryCard');
  if (modalEl) {
    modalEl.innerHTML = cardHtml;
  }

  const settingsEl = document.getElementById('settingsGdeDirectoryCard');
  if (settingsEl) {
    if (!hasDirectoryInfo) {
      settingsEl.hidden = true;
      settingsEl.innerHTML = '';
    } else {
      settingsEl.hidden = false;
      settingsEl.innerHTML = cardHtml;
    }
  }
}

type GdeThemeId = 'midnight' | 'daylight' | 'eink' | 'tropical' | 'terminal';

const SUNDIAL_THEMES: Record<
  GdeThemeId,
  { label: string; angle: string; desc: string }
> = {
  eink: {
    label: 'E-Ink',
    angle: '-90deg',
    desc: 'Pure black-and-white monochrome ink with 1.5px solid borders, zero page gradients, and crisp e-reader contrast.',
  },
  tropical: {
    label: 'Tropical',
    angle: '-45deg',
    desc: 'Sunlit seafoam and deep ocean-teal contrast paired with warm hibiscus coral highlights.',
  },
  midnight: {
    label: 'Midnight',
    angle: '0deg',
    desc: 'Official 2026 Google Developer Experts dark-navy brand palette with periwinkle and sky accents.',
  },
  daylight: {
    label: 'Daylight',
    angle: '45deg',
    desc: 'Crisp slate-on-white daylight palette tuned for bright conference halls and high contrast.',
  },
  terminal: {
    label: 'Terminal',
    angle: '90deg',
    desc: 'High-contrast P1 phosphor green on deep CRT black with monospace typography and subtle scanlines.',
  },
};

const THEME_STORAGE_KEY = 'gde_planner_theme_v1';

function getSavedTheme(): GdeThemeId {
  const raw = localStorage.getItem(THEME_STORAGE_KEY) || 'midnight';
  return raw in SUNDIAL_THEMES ? (raw as GdeThemeId) : 'midnight';
}

function applySundialTheme(themeId: GdeThemeId, persist = true): void {
  const validTheme: GdeThemeId = themeId in SUNDIAL_THEMES ? themeId : 'midnight';
  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, validTheme);
  }
  document.documentElement.dataset.theme = validTheme;

  const meta = SUNDIAL_THEMES[validTheme];
  const wheel = document.getElementById('themeSundialWheel');
  if (wheel) {
    const deg = parseFloat(meta.angle) || 0;
    wheel.style.setProperty('--sundial-angle', meta.angle);
    wheel.style.setProperty('--stargate-ring-spin', `${-deg * 2.2}deg`);
    if (persist) {
      wheel.classList.remove('is-locking');
      void wheel.offsetWidth;
      wheel.classList.add('is-locking');
    }
  }
  const triggerBtn = document.getElementById('btnToggleSundial');
  if (triggerBtn) {
    triggerBtn.style.setProperty('--sundial-angle', meta.angle);
  }
  const desc = document.getElementById('sundialThemeDesc');
  if (desc) {
    desc.textContent = meta.desc;
  }

  document.querySelectorAll<HTMLElement>('[data-theme-choice]').forEach((btn) => {
    const isMatch = btn.dataset.themeChoice === validTheme;
    btn.classList.toggle('is-active', isMatch);
    if (btn.getAttribute('role') === 'radio') {
      btn.setAttribute('aria-checked', isMatch ? 'true' : 'false');
    }
  });
}

document.addEventListener('click', (e) => {
  const el = e.target as HTMLElement | null;
  if (!el) return;

  const toggleBtn = el.closest<HTMLButtonElement>('#btnToggleSundial');
  if (toggleBtn) {
    const modal = document.getElementById('themeSundialModal') as HTMLDialogElement | null;
    if (modal) {
      if (modal.open) modal.close();
      else modal.showModal();
    }
    return;
  }

  const closeBtn = el.closest<HTMLButtonElement>('#btnCloseSundialModal');
  if (closeBtn) {
    const modal = document.getElementById('themeSundialModal') as HTMLDialogElement | null;
    if (modal?.open) modal.close();
    return;
  }

  const target = el.closest<HTMLElement>('[data-theme-choice]');
  if (!target) return;
  const choice = target.dataset.themeChoice as GdeThemeId;
  if (choice) {
    applySundialTheme(choice, true);
  }
});

function switchWorkspaceModule(mod: 'pulse' | 'travel'): void {
  const travelEnabled = currentProfile.travelPlannerEnabled !== false;
  activeWorkspaceModule = mod === 'travel' && !travelEnabled ? 'pulse' : mod;

  const pulseContainer = $('pulseHostModuleContainer');
  const travelContainer = $('travelPlannerModuleContainer');
  const addEventBtn = $('btnOpenAddEvent');
  const travelTabBtn = $('btnSwitchModuleTravel');
  const productTitle = $('topbarProductTitle');

  travelTabBtn.hidden = !travelEnabled;

  document.querySelectorAll<HTMLButtonElement>('[data-workspace-module]').forEach((btn) => {
    const isActive = btn.dataset.workspaceModule === activeWorkspaceModule;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  pulseContainer.hidden = activeWorkspaceModule !== 'pulse';
  travelContainer.hidden = activeWorkspaceModule !== 'travel';
  addEventBtn.hidden = activeWorkspaceModule !== 'travel' || $('dashboardView').hidden;
  productTitle.textContent =
    activeWorkspaceModule === 'travel' ? 'GDE Pulse · Travel Planner' : 'GDE Pulse';

  if (activeWorkspaceModule === 'pulse') {
    renderPulseHostModule();
  } else {
    renderTravelPlanner();
  }
}

function switchScreen(screen: 'welcome' | 'config' | 'dashboard'): void {
  document.documentElement.dataset.screen = screen;
  if (screen === 'welcome') {
    document.documentElement.dataset.theme = 'midnight';
    const sundialModal = document.getElementById('themeSundialModal') as HTMLDialogElement | null;
    if (sundialModal?.open) sundialModal.close();
  } else {
    applySundialTheme(getSavedTheme(), false);
  }

  $('welcomeView').hidden = screen !== 'welcome';
  $('appHeader').hidden = screen === 'welcome';
  $('configView').hidden = screen !== 'config';
  $('dashboardView').hidden = screen !== 'dashboard';

  if (screen === 'config') {
    renderHeader();
    $('btnOpenAddEvent').hidden = true;
    populateConfigForm(currentProfile);
    window.setTimeout(() => {
      if (!currentProfile.advocuApiKey) {
        $<HTMLInputElement>('cfgAdvocuKey').focus();
      }
    }, 60);
  } else if (screen === 'dashboard') {
    renderHeader();
    switchWorkspaceModule(activeWorkspaceModule);
  }
}

function renderHeader(): void {
  const avatarEl = $<HTMLImageElement>('headerUserAvatar');
  const fallbackEl = document.getElementById('headerUserAvatarFallback');
  if (currentProfile.avatarUrl) {
    avatarEl.src = currentProfile.avatarUrl;
    avatarEl.hidden = false;
    if (fallbackEl) fallbackEl.hidden = true;
  } else {
    avatarEl.hidden = true;
    if (fallbackEl) fallbackEl.hidden = false;
  }
  const orgSuffix = currentProfile.organization ? ` (${currentProfile.organization})` : '';
  $('headerUserBadge').textContent =
    `${currentProfile.displayName}${orgSuffix} · ${currentProfile.email}`;
  $('btnSwitchModuleTravel').hidden = currentProfile.travelPlannerEnabled === false;
  renderGdeDirectoryCards(currentProfile);
}

function populateConfigForm(profile: GdeProfile): void {
  $('configHeading').textContent = `Welcome, ${profile.displayName || 'GDE'}`;
  $<HTMLInputElement>('cfgAdvocuKey').value = profile.advocuApiKey || '';
  $<HTMLInputElement>('cfgName').value = profile.displayName || '';
  $<HTMLInputElement>('cfgEmail').value = profile.email || '';
  $<HTMLInputElement>('cfgSessionizeEmail').value = profile.sessionizeEmail || '';
  $<HTMLInputElement>('cfgHomeCountry').value = profile.homeCountry || '';
  $<HTMLSelectElement>('cfgHomeRegion').value = profile.homeRegion || 'Europe';
  $<HTMLInputElement>('cfgSessionizeId').value = profile.sessionizeSpeakerId || '';
  $<HTMLInputElement>('cfgEnableTravelPlanner').checked =
    profile.travelPlannerEnabled !== false;

  const catSet = new Set(profile.categories || []);
  document
    .querySelectorAll<HTMLInputElement>('#cfgCategories input[type="checkbox"]')
    .forEach((cb) => {
      cb.checked = catSet.has(cb.value as GdeCategory);
    });
  renderGdeDirectoryCards(profile);
  renderAgentTokenState();
}

function readConfigForm(): GdeProfile {
  const homeCountry = $<HTMLInputElement>('cfgHomeCountry').value.trim();
  const homeRegion = resolveRegion(
    homeCountry,
    $<HTMLSelectElement>('cfgHomeRegion').value as GdeRegion,
  );
  const categories = Array.from(
    document.querySelectorAll<HTMLInputElement>('#cfgCategories input[type="checkbox"]:checked'),
  ).map((cb) => cb.value as GdeCategory);

  const email = $<HTMLInputElement>('cfgEmail').value.trim();
  return {
    ...currentProfile,
    advocuApiKey: $<HTMLInputElement>('cfgAdvocuKey').value.trim(),
    displayName: $<HTMLInputElement>('cfgName').value.trim() || email.split('@')[0] || 'GDE',
    email,
    sessionizeEmail: $<HTMLInputElement>('cfgSessionizeEmail').value.trim(),
    homeCountry,
    homeRegion,
    currentCountry: homeCountry,
    currentRegion: homeRegion,
    sessionizeSpeakerId: $<HTMLInputElement>('cfgSessionizeId').value.trim(),
    categories,
    travelPlannerEnabled: $<HTMLInputElement>('cfgEnableTravelPlanner').checked,
    configured: true,
    updatedAt: new Date().toISOString(),
  };
}

function renderAgentTokenState(): void {
  const uid = currentSession?.uid || 'default';
  const savedToken = getSavedAgentToken(uid);
  const hasHash = Boolean(currentProfile.agentTokenHash);
  const displayVal = savedToken
    ? savedToken
    : hasHash
      ? 'Active token stored on another device — click Generate / Rotate Token to create a new one'
      : '';

  const cfgInput = document.getElementById('cfgAgentTokenDisplay') as HTMLInputElement | null;
  if (cfgInput) cfgInput.value = displayVal;

  const modalInput = document.getElementById('modalAgentTokenDisplay') as HTMLInputElement | null;
  if (modalInput) modalInput.value = displayVal;

  const sampleId = events[0]?.id || 'adv-myevent-0';
  const tokenPlaceholder = savedToken || '<YOUR_PERSONAL_AGENT_TOKEN>';
  const origin = window.location.origin || 'https://gde.web.app';
  const snippetEl = document.getElementById('agentCurlSnippet');
  if (snippetEl) {
    snippetEl.textContent =
      `# 1. Option 2 — Schema-Locked SQL Connector (SELECT / UPDATE / INSERT)\n` +
      `curl -X POST "${origin}/api/sql" \\\n` +
      `  -H "Authorization: Bearer ${tokenPlaceholder}" \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -d '{"sql": "UPDATE events SET eventApproved = true, budgetUsd = 800 WHERE id = \\x27${sampleId}\\x27"}'\n\n` +
      `# 2. Option 1 — Personal Agent REST API (Modify Event Fields Only)\n` +
      `curl -X PATCH "${origin}/api/agent/events/${sampleId}" \\\n` +
      `  -H "Authorization: Bearer ${tokenPlaceholder}" \\\n` +
      `  -H "Content-Type: application/json" \\\n` +
      `  -d '{"title": "${(events[0]?.title || 'DevFest 2026').replace(/"/g, '')}", "sessionTitle": "Building Reliable AI Agents", "eventApproved": true, "budgetUsd": 800}'`;
  }
}

async function runInteractiveSql(): Promise<void> {
  const sqlInput = $<HTMLTextAreaElement>('sqlQueryInput');
  const statusEl = $('sqlStatusBanner');
  const container = $('sqlResultsContainer');
  const sql = sqlInput.value.trim();

  try {
    const result = executeLockedSql(sql, events);

    if (result.upsertedEvents.length > 0) {
      events = await upsertEventsBatch(currentSession, result.upsertedEvents, {
        preserveExisting: false,
      });
      renderKpisAndItinerary();
      showToast(`${result.command}: Saved ${result.affectedCount} event(s) to Firestore!`);
    } else if (result.deletedEventIds.length > 0) {
      for (const delId of result.deletedEventIds) {
        events = await removeEvent(currentSession, delId);
      }
      renderKpisAndItinerary();
      showToast(`DELETE: Removed ${result.affectedCount} event(s) from Firestore!`);
    }

    statusEl.className = 'sql-status-ok';
    statusEl.textContent = `✓ ${result.command} succeeded · ${result.affectedCount} row(s) ${
      result.command === 'SELECT' || result.command === 'DESCRIBE' ? 'returned' : 'modified in Firestore'
    }`;

    if (result.rows.length === 0) {
      container.innerHTML = `<div class="empty-state">Query executed successfully (0 rows returned).</div>`;
      return;
    }

    const cols = Object.keys(result.rows[0]);
    const thead = `<thead><tr>${cols.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${result.rows
      .map(
        (r) =>
          `<tr>${cols
            .map((c) => {
              const v = r[c];
              const str = v === null || v === undefined ? '—' : typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v);
              return `<td>${escapeHtml(str)}</td>`;
            })
            .join('')}</tr>`,
      )
      .join('')}</tbody>`;
    container.innerHTML = `<div class="sql-table-wrap"><table class="sql-table">${thead}${tbody}</table></div>`;
  } catch (err: any) {
    const msg = err?.message || String(err);
    statusEl.className = 'sql-status-err';
    statusEl.textContent = `✕ ${msg}`;
    container.innerHTML = `<div class="danger-callout"><strong>Blocked by Schema Lock / Validator:</strong><br/>${escapeHtml(msg)}</div>`;
  }
}

async function handleAdvocuAutoPopulate(): Promise<void> {
  const keyInput = $<HTMLInputElement>('cfgAdvocuKey');
  const banner = $('advocuSyncBanner');
  const btn = $<HTMLButtonElement>('btnSyncAdvocu');
  const rawKey = keyInput.value.trim();

  if (!rawKey) {
    banner.hidden = false;
    banner.className = 'sync-banner warn';
    banner.textContent = 'Please paste your Advocu API key first.';
    keyInput.focus();
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Connecting to Advocu...';
  banner.hidden = false;
  banner.className = 'sync-banner';
  banner.textContent =
    'Calling Advocu API & me.developers.google.com/communities/experts to populate your GDE profile...';

  const existingForm = readConfigForm();
  const res = await syncFromAdvocuKey(
    rawKey,
    currentSession?.email || existingForm.email,
    currentSession?.displayName || existingForm.displayName,
  );

  if (res.ok) {
    const patch = res.profilePatch;
    currentProfile = {
      ...existingForm,
      advocuApiKey: patch.advocuApiKey || rawKey,
      displayName: patch.displayName || existingForm.displayName,
      email: patch.email || existingForm.email,
      homeCountry: patch.homeCountry || existingForm.homeCountry,
      homeRegion: patch.homeCountry
        ? patch.homeRegion || existingForm.homeRegion
        : existingForm.homeRegion,
      currentCountry: patch.currentCountry || existingForm.currentCountry,
      currentRegion: patch.currentCountry
        ? patch.currentRegion || existingForm.currentRegion
        : existingForm.currentRegion,
      categories:
        patch.categories && patch.categories.length > 0
          ? patch.categories
          : existingForm.categories,
      avatarUrl: patch.avatarUrl || existingForm.avatarUrl,
      organization: patch.organization || existingForm.organization,
      bio: patch.bio || existingForm.bio,
      location: patch.location || existingForm.location,
      gdeProfileUrl: patch.gdeProfileUrl || existingForm.gdeProfileUrl,
      specializations:
        patch.specializations && patch.specializations.length > 0
          ? patch.specializations
          : existingForm.specializations,
      configured: true,
    };
    try {
      await persistProfile(currentSession, currentProfile);
      populateConfigForm(currentProfile);
    } catch (err) {
      banner.className = 'sync-banner warn';
      banner.textContent =
        err instanceof Error ? err.message : 'Failed to save encrypted Advocu key.';
      btn.disabled = false;
      btn.textContent = 'Retry Connect';
      return;
    }

    if (res.importedEvents.length > 0) {
      events = await upsertEventsBatch(currentSession, res.importedEvents, {
        preserveExisting: true,
      });
    }
  }

  banner.className = res.ok ? 'sync-banner' : 'sync-banner warn';
  banner.textContent = res.message;
  btn.disabled = false;
  btn.textContent = res.ok ? 'Auto-Populated ✓' : 'Retry Connect';
  renderHeader();
}

function wireHostShellEvents(): void {
  document.querySelectorAll<HTMLDialogElement>('dialog.modal').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg) dlg.close();
    });
  });

  $('btnGoogleSignIn').addEventListener('click', async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      showToast(
        `Google Sign-In interrupted: ${err instanceof Error ? err.message : 'Please try again.'}`,
      );
    }
  });

  $('headerModuleSwitcher').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-workspace-module]');
    if (!btn) return;
    const mod = (btn.dataset.workspaceModule as 'pulse' | 'travel') || 'pulse';
    if ($('dashboardView').hidden) {
      activeWorkspaceModule = mod;
      switchScreen('dashboard');
    } else {
      switchWorkspaceModule(mod);
    }
  });

  $('btnOpenCreatorModal').addEventListener('click', () => {
    $<HTMLDialogElement>('creatorModal').showModal();
  });
  $('btnCloseCreatorModal').addEventListener('click', () => {
    $<HTMLDialogElement>('creatorModal').close();
  });

  $('btnOpenGdeProfile').addEventListener('click', () => {
    renderGdeDirectoryCards(currentProfile);
    $<HTMLDialogElement>('gdeProfileModal').showModal();
  });
  $('gdeProfileModal').addEventListener('click', (e) => {
    const closeBtn = (e.target as HTMLElement).closest('#btnCloseGdeProfileModal');
    if (closeBtn) $<HTMLDialogElement>('gdeProfileModal').close();
  });
  $('btnSwitchToConfig').addEventListener('click', () => switchScreen('config'));
  $('btnSkipToDashboard').addEventListener('click', () => switchScreen('dashboard'));
  $('btnOpenAddEvent').addEventListener('click', () => openEventModal());
  $('btnSignOut').addEventListener('click', async () => {
    await signOutUser();
  });

  $('btnAdvocuKeyHelp').addEventListener('click', () => {
    const helpBox = $('advocuHelpBox');
    const isHidden = helpBox.hidden;
    helpBox.hidden = !isHidden;
    $('btnAdvocuKeyHelp').setAttribute('aria-expanded', String(isHidden));
  });

  $('btnSyncAdvocu').addEventListener('click', () => {
    void handleAdvocuAutoPopulate();
  });

  $<HTMLInputElement>('cfgAdvocuKey').addEventListener('paste', () => {
    window.setTimeout(() => {
      void handleAdvocuAutoPopulate();
    }, 80);
  });

  $('configForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const candidate = readConfigForm();
    try {
      await persistProfile(currentSession, candidate);
      currentProfile = candidate;
      populateConfigForm(currentProfile);
      showToast(`Saved settings for ${currentProfile.displayName}!`);
      switchScreen('dashboard');
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Could not save settings. Please check your connection and try again.',
      );
    }
  });

  $('btnOpenDeleteProfile').addEventListener('click', () => {
    $<HTMLDialogElement>('deleteProfileModal').showModal();
  });
  $('btnCloseDeleteProfile').addEventListener('click', () => {
    $<HTMLDialogElement>('deleteProfileModal').close();
  });
  $('btnCancelDeleteProfile').addEventListener('click', () => {
    $<HTMLDialogElement>('deleteProfileModal').close();
  });
  $('btnConfirmDeleteProfile').addEventListener('click', async () => {
    const confirmBtn = $<HTMLButtonElement>('btnConfirmDeleteProfile');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting Profile...';
    try {
      if (unsubscribeEvents) {
        unsubscribeEvents();
        unsubscribeEvents = null;
      }
      await deleteUserAccountAndData(currentSession);
      currentSession = null;
      currentProfile = { ...DEFAULT_ANDRES_PROFILE };
      events = [];
      $<HTMLDialogElement>('deleteProfileModal').close();
      switchScreen('welcome');
      showToast('Your profile, API keys, events, and login have been deleted from GDE Pulse.');
    } catch (err) {
      showToast(
        `Could not complete deletion: ${err instanceof Error ? err.message : 'Please try again.'}`,
      );
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Yes, Delete My Profile';
    }
  });

  const openSqlModal = () => {
    renderAgentTokenState();
    $<HTMLDialogElement>('sqlAgentModal').showModal();
    void runInteractiveSql();
  };

  $('btnOpenSqlAgentModal').addEventListener('click', openSqlModal);
  $('btnOpenSqlConsoleFromSettings').addEventListener('click', openSqlModal);
  $('btnCloseSqlAgentModal').addEventListener('click', () =>
    $<HTMLDialogElement>('sqlAgentModal').close(),
  );
  $('btnDoneSqlAgentModal').addEventListener('click', () =>
    $<HTMLDialogElement>('sqlAgentModal').close(),
  );

  $('btnRunSql').addEventListener('click', () => {
    void runInteractiveSql();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-sql-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.dataset.sqlPreset || '';
      $<HTMLTextAreaElement>('sqlQueryInput').value = preset;
      void runInteractiveSql();
    });
  });

  $('btnPresetSampleUpdate').addEventListener('click', () => {
    const sample = events[0];
    const id = sample?.id || 'adv-myevent-0';
    const budget = sample?.budgetUsd || 800;
    $<HTMLTextAreaElement>('sqlQueryInput').value =
      `UPDATE events SET eventApproved = true, budgetUsd = ${budget} WHERE id = '${id}'`;
  });

  const handleGenerateToken = async () => {
    const { rawToken, updatedProfile } = await generatePersonalAgentToken(
      currentSession,
      currentProfile,
    );
    currentProfile = updatedProfile;
    renderAgentTokenState();
    try {
      await navigator.clipboard.writeText(rawToken);
      showToast('Personal Agent Token generated and copied to clipboard!');
    } catch {
      showToast('Personal Agent Token generated!');
    }
  };

  $('btnGenerateAgentToken').addEventListener('click', () => void handleGenerateToken());
  $('btnModalGenerateToken').addEventListener('click', () => void handleGenerateToken());

  const handleCopyToken = async () => {
    const uid = currentSession?.uid || 'default';
    const raw = getSavedAgentToken(uid);
    if (!raw) {
      showToast('Generate a Personal Agent Token first.');
      return;
    }
    await navigator.clipboard.writeText(raw);
    showToast('Personal Agent Token copied to clipboard!');
  };

  $('btnCopyAgentToken').addEventListener('click', () => void handleCopyToken());
  $('btnModalCopyToken').addEventListener('click', () => void handleCopyToken());

  $('btnRevokeAgentToken').addEventListener('click', async () => {
    currentProfile = await revokePersonalAgentToken(currentSession, currentProfile);
    renderAgentTokenState();
    showToast('Personal Agent Token revoked.');
  });

  $('btnCopySqlCurl').addEventListener('click', async () => {
    const uid = currentSession?.uid || 'default';
    const token = getSavedAgentToken(uid) || '<YOUR_PERSONAL_AGENT_TOKEN>';
    const sampleId = events[0]?.id || 'adv-myevent-0';
    const origin = window.location.origin || 'https://gde.web.app';
    const cmd = `curl -X POST "${origin}/api/sql" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '{"sql": "UPDATE events SET eventApproved = true, budgetUsd = 800 WHERE id = \\x27${sampleId}\\x27"}'`;
    await navigator.clipboard.writeText(cmd);
    showToast('SQL Connector cURL copied to clipboard!');
  });

  $('btnCopyAgentCurl').addEventListener('click', async () => {
    const uid = currentSession?.uid || 'default';
    const token = getSavedAgentToken(uid) || '<YOUR_PERSONAL_AGENT_TOKEN>';
    const sampleId = events[0]?.id || 'adv-myevent-0';
    const origin = window.location.origin || 'https://gde.web.app';
    const cmd = `curl -X PATCH "${origin}/api/agent/events/${sampleId}" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '{"eventApproved": true, "budgetUsd": 800}'`;
    await navigator.clipboard.writeText(cmd);
    showToast('Agent REST API cURL copied to clipboard!');
  });
}

// ============================================================================
// BOOTSTRAP: PARTICIPANT PORTAL (gpulse.web.app) vs GDE HOST APP (gde.web.app)
// ============================================================================
const yearEl = document.getElementById('creatorCopyrightYear');
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

if (isParticipantPortal()) {
  applySundialTheme(getSavedTheme(), false);
  initParticipantPortal(escapeHtml, showToast);
} else {
  wireHostShellEvents();

  initPulseHostModule({
    getSession: () => currentSession,
    getProfile: () => currentProfile,
    showToast,
    escapeHtml,
  });

  initTravelPlannerModule({
    getSession: () => currentSession,
    getProfile: () => currentProfile,
    getEvents: () => events,
    setEvents: (next) => {
      events = next;
    },
    showToast,
    escapeHtml,
    switchToConfigForAdvocuKey: () => {
      switchScreen('config');
      window.setTimeout(() => {
        $<HTMLInputElement>('cfgAdvocuKey').focus();
      }, 80);
    },
  });

  const initialCachedSession = getSavedSession();
  if (initialCachedSession) {
    currentSession = initialCachedSession;
    currentProfile = loadLocalProfile(initialCachedSession.uid);
    events = loadLocalEvents(initialCachedSession.uid);
    bindPulseHostSession(initialCachedSession);
    switchScreen(currentProfile.configured ? 'dashboard' : 'config');
  }

  watchAuth(async (session) => {
    currentSession = session;
    bindPulseHostSession(session);
    if (unsubscribeEvents) {
      unsubscribeEvents();
      unsubscribeEvents = null;
    }

    if (!session) {
      events = [];
      currentProfile = { ...DEFAULT_ANDRES_PROFILE };
      switchScreen('welcome');
      return;
    }

    const cachedProfile = loadLocalProfile(session.uid);
    const cachedEvents = loadLocalEvents(session.uid);
    if (cachedEvents.length > 0 && events.length === 0) {
      events = cachedEvents;
    }
    if (cachedProfile.configured) {
      currentProfile = cachedProfile;
      if ($('dashboardView').hidden && $('configView').hidden) {
        switchScreen('dashboard');
      } else {
        renderHeader();
      }
    }

    unsubscribeEvents = subscribeEvents(session, (loaded) => {
      events = loaded;
      if (!$('dashboardView').hidden && activeWorkspaceModule === 'travel') {
        renderKpisAndItinerary();
      }
    });

    const { profile, isConfigured } = await fetchOrCreateCloudProfile(session);
    if (currentSession?.uid !== session.uid) return;
    currentProfile = profile;

    if (!isConfigured) {
      switchScreen('config');
    } else if ($('dashboardView').hidden && $('configView').hidden) {
      switchScreen('dashboard');
    } else {
      renderHeader();
      if (!$('configView').hidden) {
        populateConfigForm(currentProfile);
      } else {
        switchWorkspaceModule(activeWorkspaceModule);
      }
    }

    void fetchGdeDirectoryProfile(
      currentProfile.displayName || session.displayName,
      currentProfile.email || session.email,
    ).then((dirPatch) => {
      if (!dirPatch || currentSession?.uid !== session.uid) return;
      const mergedCats = new Set<GdeCategory>([
        ...(currentProfile.categories || []),
        ...(dirPatch.categories || []),
      ]);
      currentProfile = {
        ...currentProfile,
        avatarUrl: dirPatch.avatarUrl || currentProfile.avatarUrl,
        organization: dirPatch.organization || currentProfile.organization,
        bio: dirPatch.bio || currentProfile.bio,
        location: dirPatch.location || currentProfile.location,
        gdeProfileUrl: dirPatch.gdeProfileUrl || currentProfile.gdeProfileUrl,
        specializations: dirPatch.specializations?.length
          ? dirPatch.specializations
          : currentProfile.specializations,
        homeCountry: currentProfile.homeCountry || dirPatch.homeCountry || '',
        homeRegion: currentProfile.homeCountry
          ? currentProfile.homeRegion
          : dirPatch.homeRegion || currentProfile.homeRegion,
        currentCountry: currentProfile.currentCountry || dirPatch.currentCountry || '',
        currentRegion: currentProfile.currentCountry
          ? currentProfile.currentRegion
          : dirPatch.currentRegion || currentProfile.currentRegion,
        categories: Array.from(mergedCats),
      };
      void persistDirectoryEnrichment(session, currentProfile);
      renderHeader();
      if (!$('configView').hidden) {
        populateConfigForm(currentProfile);
      }
    });

    if (currentProfile.advocuApiKey) {
      void syncFromAdvocuKey(
        currentProfile.advocuApiKey,
        currentProfile.email || session.email,
        currentProfile.displayName || session.displayName,
      ).then(async (res) => {
        if (currentSession?.uid !== session.uid || !res.ok) return;
        if (res.importedEvents.length > 0) {
          events = await upsertEventsBatch(session, res.importedEvents, {
            preserveExisting: true,
          });
          if (!$('dashboardView').hidden && activeWorkspaceModule === 'travel') {
            renderKpisAndItinerary();
          }
        }
      });
    }
  });
}
