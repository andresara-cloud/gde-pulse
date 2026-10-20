import {
  type AuthSession,
  clearPulseQuizParticipants,
  deletePulseQuiz,
  ensureParticipantAuth,
  getSavedParticipantName,
  joinPulseQuizQueue,
  subscribeHostQuizzes,
  subscribeLiveQuizForParticipant,
  subscribeQuizParticipants,
  submitPulseQuizAnswer,
  upsertPulseQuiz,
} from './firebase.ts';
import { compressEventPhoto } from './integrations.ts';
import {
  calculatePulseAnswerPoints,
  type GdeProfile,
  generateComedicParticipantName,
  isValidPulseImageUrl,
  normalizePulseTimeLimit,
  PULSE_TIME_LIMIT_OPTIONS,
  type PulseParticipant,
  type PulseQuestion,
  type PulseQuiz,
  type PulseTimeLimitSec,
} from './policy.ts';

export interface PulseHostContext {
  getSession: () => AuthSession | null;
  getProfile: () => GdeProfile;
  showToast: (msg: string) => void;
  escapeHtml: (str: string) => string;
}

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const PULSE_VECTOR_SVG = `
  <div class="pulse-vector-banner" aria-hidden="true">
    <svg class="pulse-vector-svg" viewBox="0 0 240 80" width="168" height="56" fill="none">
      <defs>
        <linearGradient id="gdePulseGrad" x1="20" y1="40" x2="220" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#EA4335" />
          <stop offset="35%" stop-color="#4285F4" />
          <stop offset="70%" stop-color="#FBBC04" />
          <stop offset="100%" stop-color="#34A853" />
        </linearGradient>
      </defs>
      <path d="M34 20 L14 40 L34 60" stroke="#EA4335" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
      <path
        class="pulse-vector-wave"
        d="M44 40 H74 L88 22 L104 62 L122 12 L138 56 L152 30 L162 40 H196"
        stroke="url(#gdePulseGrad)"
        stroke-width="6"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M206 20 L226 40 L206 60" stroke="#34A853" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="122" cy="12" r="4.5" fill="#FBBC04" />
      <circle cx="88" cy="22" r="3.5" fill="#4285F4" />
      <circle cx="152" cy="30" r="3.5" fill="#34A853" />
    </svg>
  </div>
`;

let hostCtx: PulseHostContext | null = null;
let hostQuizzes: PulseQuiz[] = [];
let editingQuiz: PulseQuiz | null = null;
let liveHostQuizId: string | null = null;
let liveHostParticipants: PulseParticipant[] = [];
let unsubHostQuizzes: (() => void) | null = null;
let unsubHostParticipants: (() => void) | null = null;
let hostTimerInterval: number | null = null;

// Participant state (gpulse.web.app)
let enteredParticipantCode: string = '';
let activeParticipantQuiz: PulseQuiz | null = null;
let activeParticipantRecord: PulseParticipant | null = null;
let allQuizParticipants: PulseParticipant[] = [];
let unsubParticipantQuiz: (() => void) | null = null;
let unsubParticipantList: (() => void) | null = null;
let participantTimerInterval: number | null = null;
let currentSubscribedQuizId: string | null = null;
let isSubmittingAnswer = false;

export function isParticipantPortal(): boolean {
  const host = (window.location.hostname || '').toLowerCase();
  const params = new URLSearchParams(window.location.search);
  return (
    host.startsWith('gpulse.') ||
    host === 'gpulse' ||
    params.has('play') ||
    params.has('c') ||
    window.location.pathname.startsWith('/play')
  );
}

function createBlankQuestion(index: number): PulseQuestion {
  return {
    id: `q-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
    prompt: '',
    imageUrl: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    timeLimitSec: 15,
  };
}

function createSampleWorkshopQuiz(session: AuthSession | null, profile: GdeProfile): PulseQuiz {
  const nowIso = new Date().toISOString();
  const code = `GDE${Math.floor(10 + Math.random() * 89)}`;
  return {
    id: `quiz-${Date.now()}`,
    ownerUid: session?.uid || 'default',
    ownerName: profile.displayName || session?.displayName || 'GDE Host',
    title: 'Build with AI & Modern Web — Live Workshop Quiz',
    code,
    status: 'draft',
    isActive: true,
    currentQuestionIndex: -1,
    questionStartedAt: 0,
    questions: [
      {
        id: `q-${Date.now()}-1`,
        prompt: 'Which Gemini capability allows an AI agent to call external functions or APIs?',
        imageUrl: '',
        options: [
          'Tool / Function Calling',
          'Temperature Scaling',
          'Top-K Sampling',
          'CSS Grid Layout',
        ],
        correctIndex: 0,
        timeLimitSec: 15,
      },
      {
        id: `q-${Date.now()}-2`,
        prompt: 'In Firebase Firestore, which method listens for real-time document updates?',
        imageUrl: '',
        options: ['getDocOnce()', 'onSnapshot()', 'fetchRealtime()', 'pollCollection()'],
        correctIndex: 1,
        timeLimitSec: 10,
      },
      {
        id: `q-${Date.now()}-3`,
        prompt: 'What is the main advantage of native HTML <dialog> with showModal()?',
        imageUrl: '',
        options: [
          'Requires a 50KB external library',
          'Built-in top-layer backdrop, focus trap & Escape key handling',
          'Only works on Internet Explorer',
          'Disables CSS variables',
        ],
        correctIndex: 1,
        timeLimitSec: 15,
      },
    ],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function createBlankQuiz(session: AuthSession | null, profile: GdeProfile): PulseQuiz {
  const nowIso = new Date().toISOString();
  const code = `GDE${Math.floor(10 + Math.random() * 89)}`;
  return {
    id: `quiz-${Date.now()}`,
    ownerUid: session?.uid || 'default',
    ownerName: profile.displayName || session?.displayName || 'GDE Host',
    title: '',
    code,
    status: 'draft',
    isActive: true,
    currentQuestionIndex: -1,
    questionStartedAt: 0,
    questions: [createBlankQuestion(1)],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

// ============================================================================
// HOST SIDE: CONFIGURATOR + LIVE WORKSHOP CONTROLLER (gde.web.app)
// ============================================================================
export function bindPulseHostSession(session: AuthSession | null): void {
  if (unsubHostQuizzes) {
    unsubHostQuizzes();
    unsubHostQuizzes = null;
  }
  if (!session) {
    hostQuizzes = [];
    editingQuiz = null;
    liveHostQuizId = null;
    stopHostTimer();
    return;
  }
  unsubHostQuizzes = subscribeHostQuizzes(session, (quizzes) => {
    hostQuizzes = quizzes;
    if (!editingQuiz && !liveHostQuizId && quizzes.length > 0) {
      editingQuiz = structuredClone(quizzes[0]);
    }
    renderPulseHostModule();
  });
}

function stopHostTimer(): void {
  if (hostTimerInterval !== null) {
    window.clearInterval(hostTimerInterval);
    hostTimerInterval = null;
  }
}

function startHostTimerLoop(): void {
  stopHostTimer();
  hostTimerInterval = window.setInterval(() => {
    const liveQuiz = hostQuizzes.find((q) => q.id === liveHostQuizId);
    if (!liveQuiz || liveQuiz.status !== 'question') {
      stopHostTimer();
      return;
    }
    const q = liveQuiz.questions[liveQuiz.currentQuestionIndex];
    if (!q) return;
    const elapsedSec = Math.max(0, (Date.now() - (liveQuiz.questionStartedAt || 0)) / 1000);
    const remaining = Math.max(0, Math.ceil(q.timeLimitSec - elapsedSec));
    const pct = Math.max(0, Math.min(100, ((q.timeLimitSec - elapsedSec) / q.timeLimitSec) * 100));

    const timerText = document.getElementById('hostLiveTimerText');
    const timerBar = document.getElementById('hostLiveTimerBar');
    if (timerText) timerText.textContent = `${remaining}s`;
    if (timerBar) timerBar.style.width = `${pct}%`;

    if (remaining <= 0 && hostCtx) {
      stopHostTimer();
      void advanceLiveQuizToReveal(liveQuiz);
    }
  }, 200);
}

async function advanceLiveQuizToReveal(liveQuiz: PulseQuiz): Promise<void> {
  if (!hostCtx || liveQuiz.status !== 'question') return;
  const updated: PulseQuiz = {
    ...liveQuiz,
    status: 'reveal',
    updatedAt: new Date().toISOString(),
  };
  hostQuizzes = await upsertPulseQuiz(hostCtx.getSession(), updated);
  renderPulseHostModule();
}

function syncEditorDomToEditingQuiz(): void {
  if (!editingQuiz) return;
  const titleEl = document.getElementById('pulseQuizTitleInput') as HTMLInputElement | null;
  const codeEl = document.getElementById('pulseQuizCodeInput') as HTMLInputElement | null;
  if (titleEl) editingQuiz.title = titleEl.value;
  if (codeEl) editingQuiz.code = codeEl.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');

  const qCards = document.querySelectorAll<HTMLElement>('[data-q-index]');
  qCards.forEach((card) => {
    const idx = Number(card.dataset.qIndex);
    const q = editingQuiz?.questions[idx];
    if (!q) return;
    const promptEl = card.querySelector<HTMLInputElement>('[data-q-field="prompt"]');
    const timeEl = card.querySelector<HTMLSelectElement>('[data-q-field="timeLimitSec"]');
    const imgEl = card.querySelector<HTMLInputElement>('[data-q-field="imageUrl"]');
    if (promptEl) q.prompt = promptEl.value;
    if (timeEl) q.timeLimitSec = normalizePulseTimeLimit(timeEl.value);
    if (imgEl) q.imageUrl = isValidPulseImageUrl(imgEl.value) ? imgEl.value.trim() : '';

    const optInputs = card.querySelectorAll<HTMLInputElement>('[data-opt-index]');
    optInputs.forEach((inp) => {
      const optIdx = Number(inp.dataset.optIndex);
      if (optIdx >= 0 && optIdx < q.options.length) {
        q.options[optIdx] = inp.value;
      }
    });
  });
}

export function renderPulseHostModule(): void {
  if (!hostCtx) return;
  const container = document.getElementById('pulseHostModuleContainer');
  if (!container) return;
  const escapeHtml = hostCtx.escapeHtml;
  const session = hostCtx.getSession();
  const profile = hostCtx.getProfile();

  // If currently hosting a live quiz session, show the Stage Controller View
  const liveQuiz = liveHostQuizId ? hostQuizzes.find((q) => q.id === liveHostQuizId) : null;
  if (liveQuiz) {
    renderLiveStageController(container, liveQuiz);
    return;
  }

  stopHostTimer();
  if (!editingQuiz) {
    editingQuiz =
      hostQuizzes.length > 0
        ? structuredClone(hostQuizzes[0])
        : createBlankQuiz(session, profile);
  }

  const savedListHtml =
    hostQuizzes.length === 0
      ? `<span class="muted-sm">No saved quizzes yet — configure your first workshop quiz below or load the sample template.</span>`
      : hostQuizzes
          .map((q) => {
            const isSelected = editingQuiz?.id === q.id;
            const isLive = q.status === 'lobby' || q.status === 'question' || q.status === 'reveal';
            return `
              <div class="pulse-quiz-pill ${isSelected ? 'is-selected' : ''}">
                <button type="button" class="pulse-quiz-pill-select" data-pulse-action="select-quiz" data-quiz-id="${escapeHtml(q.id)}">
                  <strong>${escapeHtml(q.title || 'Untitled Quiz')}</strong>
                  <span class="muted-sm">${q.questions.length} Qs &middot; Code: ${escapeHtml(q.code)}</span>
                  ${isLive ? `<span class="chip chip-green">LIVE (${escapeHtml(q.status.toUpperCase())})</span>` : ''}
                </button>
                <div class="pulse-quiz-pill-actions">
                  <button type="button" class="btn btn-primary btn-sm" data-pulse-action="launch-lobby" data-quiz-id="${escapeHtml(q.id)}" title="Open Live Lobby & Start Quiz">
                    ▶ Host Live
                  </button>
                  <button type="button" class="btn btn-danger-ghost btn-sm" data-pulse-action="delete-quiz" data-quiz-id="${escapeHtml(q.id)}" title="Delete Quiz">
                    &times;
                  </button>
                </div>
              </div>
            `;
          })
          .join('');

  const questionsHtml = editingQuiz.questions
    .map((q, qIdx) => {
      const timeOptionsHtml = PULSE_TIME_LIMIT_OPTIONS.map(
        (sec) =>
          `<option value="${sec}" ${q.timeLimitSec === sec ? 'selected' : ''}>${sec} seconds</option>`,
      ).join('');

      const optionsHtml = q.options
        .map((optText, optIdx) => {
          const isCorrect = q.correctIndex === optIdx;
          const label = OPTION_LABELS[optIdx] || String(optIdx + 1);
          return `
            <div class="pulse-option-edit-row ${isCorrect ? 'is-correct-option' : ''}">
              <button
                type="button"
                class="pulse-correct-toggle ${isCorrect ? 'is-correct' : ''}"
                data-pulse-action="set-correct-option"
                data-q-idx="${qIdx}"
                data-opt-idx="${optIdx}"
                title="${isCorrect ? 'Correct Answer' : 'Click to mark as Correct Answer'}"
              >
                <span class="pulse-opt-badge">${label}</span>
                <span>${isCorrect ? '✓ Correct' : 'Mark Correct'}</span>
              </button>
              <input
                type="text"
                data-opt-index="${optIdx}"
                value="${escapeHtml(optText)}"
                placeholder="Answer option ${label}..."
                required
              />
              ${
                q.options.length > 2
                  ? `<button type="button" class="btn-icon" data-pulse-action="remove-option" data-q-idx="${qIdx}" data-opt-idx="${optIdx}" title="Remove Option">&times;</button>`
                  : ''
              }
            </div>
          `;
        })
        .join('');

      return `
        <article class="card pulse-question-card" data-q-index="${qIdx}">
          <div class="pulse-question-header">
            <div class="step-badge-row">
              <span class="step-pill">Question ${qIdx + 1} of ${editingQuiz!.questions.length}</span>
            </div>
            <div class="pulse-question-header-controls">
              <label class="pulse-timer-select-label">
                <span>⏱ Answer Timer:</span>
                <select data-q-field="timeLimitSec" class="pulse-timer-select" aria-label="Question Time Limit">
                  ${timeOptionsHtml}
                </select>
              </label>
              ${
                editingQuiz!.questions.length > 1
                  ? `<button type="button" class="btn btn-danger-ghost btn-sm" data-pulse-action="remove-question" data-q-idx="${qIdx}">Remove Q${qIdx + 1}</button>`
                  : ''
              }
            </div>
          </div>

          <label class="field">
            <span>Question Prompt</span>
            <input
              type="text"
              data-q-field="prompt"
              value="${escapeHtml(q.prompt)}"
              placeholder="e.g. Which Gemini API feature enables structured JSON output?"
              required
            />
          </label>

          <div class="pulse-options-list">
            <div class="pulse-options-header">
              <span class="muted-sm">Multiple-Choice Answers (click a badge to set the correct answer)</span>
              ${
                q.options.length < 4
                  ? `<button type="button" class="btn btn-ghost btn-sm" data-pulse-action="add-option" data-q-idx="${qIdx}">+ Add Option</button>`
                  : ''
              }
            </div>
            <div class="pulse-options-grid">
              ${optionsHtml}
            </div>
          </div>

          <div class="pulse-image-config-row">
            <div class="pulse-image-url-col">
              <div class="advocu-key-row">
                <label class="btn btn-secondary btn-sm pulse-upload-btn">
                  📷 ${isValidPulseImageUrl(q.imageUrl) ? 'Change Question Image' : 'Add Question Image (Optional)'}
                  <input type="file" accept="image/*" data-pulse-upload-q="${qIdx}" hidden />
                </label>
                ${
                  isValidPulseImageUrl(q.imageUrl)
                    ? `<button type="button" class="btn btn-ghost btn-sm" data-pulse-action="clear-q-image" data-q-idx="${qIdx}">Remove Image</button>`
                    : ''
                }
              </div>
            </div>
            ${
              isValidPulseImageUrl(q.imageUrl)
                ? `<div class="pulse-q-image-preview">
                    <img src="${escapeHtml(q.imageUrl!)}" alt="" onerror="this.parentElement.hidden=true" />
                  </div>`
                : ''
            }
          </div>
        </article>
      `;
    })
    .join('');

  container.innerHTML = `
    <div class="pulse-host-shell">
      <!-- TOP BANNER: SHORT URL & SAVED QUIZZES -->
      <section class="card pulse-config-hero">
        <div class="pulse-config-hero-top">
          <div class="pulse-config-hero-brand">
            ${PULSE_VECTOR_SVG}
            <div>
              <span class="eyebrow">GDE Pulse &middot; Interactive Workshop Quiz</span>
              <h2>Quiz Configurator &amp; Live Host Studio</h2>
              <p class="muted">
                Create multiple-choice workshop quizzes with custom countdown timers (5s–60s) and optional images.
                Attendees join with 1-tap at <a href="https://gpulse.web.app" target="_blank" rel="noopener"><strong>gpulse.web.app</strong></a>.
              </p>
            </div>
          </div>
          <div class="pulse-config-hero-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-pulse-action="new-quiz">
              + New Blank Quiz
            </button>
            <button type="button" class="btn btn-secondary btn-sm" data-pulse-action="load-sample">
              ✨ Load Sample AI Quiz
            </button>
            <a href="/?play=1" target="_blank" rel="noopener" class="btn btn-ghost btn-sm" title="Preview the participant view in a new tab">
              📱 Preview Attendee View &nearr;
            </a>
          </div>
        </div>

        <div class="pulse-saved-quizzes-strip">
          ${savedListHtml}
        </div>
      </section>

      <!-- QUIZ EDITOR FORM -->
      <form id="pulseConfiguratorForm" class="pulse-editor-form">
        <section class="card pulse-quiz-meta-card">
          <div class="form-row-2">
            <label class="field">
              <span>Workshop / Talk Quiz Title</span>
              <input
                type="text"
                id="pulseQuizTitleInput"
                value="${escapeHtml(editingQuiz.title)}"
                placeholder="e.g. Building Agentic Workflows with Gemini — Live Quiz"
                required
              />
            </label>
            <label class="field">
              <span>Workshop Join Code (Required for attendees at <code class="mono">gpulse.web.app</code>)</span>
              <input
                type="text"
                id="pulseQuizCodeInput"
                class="mono-input"
                maxlength="12"
                value="${escapeHtml(editingQuiz.code)}"
                placeholder="GDE26"
                required
              />
            </label>
          </div>
        </section>

        <div class="pulse-questions-stack">
          ${questionsHtml}
        </div>

        <div class="pulse-editor-footer card">
          <button type="button" class="btn btn-secondary" data-pulse-action="add-question">
            + Add Question
          </button>
          <div class="pulse-editor-footer-right">
            <button type="submit" class="btn btn-secondary">
              💾 Save Quiz to Database
            </button>
            <button type="button" class="btn btn-primary btn-lg" data-pulse-action="save-and-launch">
              ▶ Save &amp; Open Live Workshop Lobby
            </button>
          </div>
        </div>
      </form>
    </div>
  `;
}

function renderLiveStageController(container: HTMLElement, quiz: PulseQuiz): void {
  if (!hostCtx) return;
  const escapeHtml = hostCtx.escapeHtml;
  const shortUrlDisplay = 'gpulse.web.app';
  const fullShortUrl = `https://gpulse.web.app/?c=${encodeURIComponent(quiz.code)}`;

  if (quiz.status === 'question') {
    startHostTimerLoop();
  } else {
    stopHostTimer();
  }

  const participantPillsHtml =
    liveHostParticipants.length === 0
      ? `<div class="pulse-empty-queue muted">Waiting for workshop attendees to join at <strong>${shortUrlDisplay}</strong>...</div>`
      : liveHostParticipants
          .map(
            (p) =>
              `<span class="pulse-participant-chip">
                <span class="pulse-participant-dot"></span>
                <strong>${escapeHtml(p.name)}</strong>
                ${quiz.status !== 'lobby' ? `<span class="muted-sm">&middot; ${p.score.toLocaleString()} pts</span>` : ''}
              </span>`,
          )
          .join('');

  let stageBodyHtml = '';

  if (quiz.status === 'lobby') {
    stageBodyHtml = `
      <div class="card pulse-lobby-stage">
        <div class="pulse-join-banner">
          <div>
            <span class="eyebrow">Host: <strong>${escapeHtml(quiz.ownerName || 'Google Developer Expert')}</strong> &middot; Go to <strong>${shortUrlDisplay}</strong></span>
            <div class="pulse-short-url-giant">Code: <span class="mono">${escapeHtml(quiz.code)}</span></div>
            <p class="muted">
              Open <strong>${shortUrlDisplay}</strong> and enter code <strong class="mono">${escapeHtml(quiz.code)}</strong> to join the queue!
            </p>
          </div>
          <div class="pulse-join-banner-actions">
            <button type="button" class="btn btn-secondary" data-pulse-action="copy-short-link" data-link="${escapeHtml(fullShortUrl)}">
              🔗 Copy Direct Code Link
            </button>
            <a href="/?play=1&c=${encodeURIComponent(quiz.code)}" target="_blank" rel="noopener" class="btn btn-ghost">
              📱 Open Attendee Simulator &nearr;
            </a>
          </div>
        </div>

        <div class="pulse-queue-box">
          <div class="pulse-queue-header">
            <h3>
              👥 Live Participant Queue
              <span class="chip chip-blue">${liveHostParticipants.length} joined</span>
            </h3>
            ${
              liveHostParticipants.length > 0
                ? `<button type="button" class="btn btn-ghost btn-sm" data-pulse-action="clear-participants">Clear Queue</button>`
                : ''
            }
          </div>
          <div class="pulse-participant-cloud">
            ${participantPillsHtml}
          </div>
        </div>

        <div class="pulse-stage-cta-row">
          <button type="button" class="btn btn-ghost" data-pulse-action="exit-live-stage">
            &larr; Back to Configurator
          </button>
          <button type="button" class="btn btn-primary btn-lg pulse-start-btn" data-pulse-action="start-question" data-q-idx="0">
            🚀 Start Quiz Now (${quiz.questions.length} Questions) &rarr;
          </button>
        </div>
      </div>
    `;
  } else if (quiz.status === 'question' || quiz.status === 'reveal') {
    const qIdx = Math.max(0, Math.min(quiz.questions.length - 1, quiz.currentQuestionIndex));
    const q = quiz.questions[qIdx];
    const isReveal = quiz.status === 'reveal';
    const elapsedSec = Math.max(0, (Date.now() - (quiz.questionStartedAt || 0)) / 1000);
    const remainingSec = isReveal ? 0 : Math.max(0, Math.ceil(q.timeLimitSec - elapsedSec));
    const pct = isReveal
      ? 0
      : Math.max(0, Math.min(100, ((q.timeLimitSec - elapsedSec) / q.timeLimitSec) * 100));

    const answeredCount = liveHostParticipants.filter(
      (p) => p.answers && p.answers[String(qIdx)] !== undefined,
    ).length;

    const optionCardsHtml = q.options
      .map((opt, idx) => {
        const isCorrect = idx === q.correctIndex;
        const pickCount = liveHostParticipants.filter(
          (p) => p.answers?.[String(qIdx)]?.selectedIndex === idx,
        ).length;
        const revealClass = isReveal
          ? isCorrect
            ? 'is-reveal-correct'
            : 'is-reveal-wrong'
          : '';
        return `
          <div class="pulse-stage-option-card opt-color-${idx % 4} ${revealClass}">
            <span class="pulse-opt-badge">${OPTION_LABELS[idx] || idx + 1}</span>
            <span class="pulse-stage-option-text">${escapeHtml(opt)}</span>
            ${
              isReveal
                ? `<span class="pulse-opt-tally">${pickCount} ${pickCount === 1 ? 'vote' : 'votes'} ${isCorrect ? '✓' : ''}</span>`
                : ''
            }
          </div>
        `;
      })
      .join('');

    const leaderboardHtml = isReveal
      ? `
        <div class="pulse-live-leaderboard">
          <h3>🏆 Live Standings</h3>
          <div class="pulse-leaderboard-list">
            ${
              liveHostParticipants.length === 0
                ? `<p class="muted-sm">No participants scored yet.</p>`
                : liveHostParticipants
                    .slice(0, 8)
                    .map(
                      (p, rankIdx) => `
                      <div class="pulse-leaderboard-row ${rankIdx === 0 ? 'is-first' : ''}">
                        <span class="pulse-rank-badge">#${rankIdx + 1}</span>
                        <strong class="pulse-lb-name">${escapeHtml(p.name)}</strong>
                        <span class="pulse-lb-correct muted-sm">${p.correctCount}/${quiz.questions.length} correct</span>
                        <strong class="pulse-lb-score">${p.score.toLocaleString()} pts</strong>
                      </div>
                    `,
                    )
                    .join('')
            }
          </div>
        </div>
      `
      : '';

    const hasNextQuestion = qIdx + 1 < quiz.questions.length;

    stageBodyHtml = `
      <div class="card pulse-active-question-stage">
        <div class="pulse-question-stage-top">
          <div>
            <span class="step-pill">Question ${qIdx + 1} of ${quiz.questions.length}</span>
            <span class="chip chip-neutral">⏱ ${q.timeLimitSec}s Limit</span>
            <span class="chip chip-blue">${answeredCount} / ${liveHostParticipants.length} Answered</span>
          </div>
          <div class="pulse-timer-pill ${isReveal ? 'is-ended' : ''}">
            <strong id="hostLiveTimerText">${isReveal ? 'Time Up!' : `${remainingSec}s`}</strong>
          </div>
        </div>

        <div class="pulse-timer-bar-track">
          <div id="hostLiveTimerBar" class="pulse-timer-bar-fill" style="width: ${pct}%"></div>
        </div>

        <h2 class="pulse-stage-prompt">${escapeHtml(q.prompt)}</h2>

        ${
          isValidPulseImageUrl(q.imageUrl)
            ? `<div class="pulse-stage-image-wrap">
                <img src="${escapeHtml(q.imageUrl!)}" alt="" class="pulse-stage-image" onerror="this.parentElement.hidden=true" />
              </div>`
            : ''
        }

        <div class="pulse-stage-options-grid">
          ${optionCardsHtml}
        </div>

        ${leaderboardHtml}

        <div class="pulse-stage-cta-row">
          <button type="button" class="btn btn-ghost" data-pulse-action="return-to-lobby">
            ↺ Back to Queue Lobby
          </button>
          <div class="pulse-stage-cta-right">
            ${
              !isReveal
                ? `<button type="button" class="btn btn-secondary btn-lg" data-pulse-action="reveal-answer">
                    👁 Reveal Correct Answer &amp; Scores
                  </button>`
                : hasNextQuestion
                  ? `<button type="button" class="btn btn-primary btn-lg" data-pulse-action="start-question" data-q-idx="${qIdx + 1}">
                      Next Question (${qIdx + 2} of ${quiz.questions.length}) &rarr;
                    </button>`
                  : `<button type="button" class="btn btn-primary btn-lg" data-pulse-action="complete-quiz">
                      🏆 Finish Quiz &amp; Show Final Podium
                    </button>`
            }
          </div>
        </div>
      </div>
    `;
  } else {
    // status === 'completed'
    const topPodium = liveHostParticipants.slice(0, 10);
    stageBodyHtml = `
      <div class="card pulse-podium-stage">
        <div class="pulse-podium-header">
          <span class="eyebrow">Workshop Quiz Complete</span>
          <h2>🏆 Final Scoreboard — ${escapeHtml(quiz.title)}</h2>
          <p class="muted">${liveHostParticipants.length} participant(s) competed at <strong>gpulse.web.app</strong></p>
        </div>

        <div class="pulse-leaderboard-list">
          ${
            topPodium.length === 0
              ? `<p class="muted">No participant scores recorded in this session.</p>`
              : topPodium
                  .map(
                    (p, idx) => `
                    <div class="pulse-leaderboard-row ${idx === 0 ? 'is-first' : idx === 1 ? 'is-second' : idx === 2 ? 'is-third' : ''}">
                      <span class="pulse-rank-badge">${idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}</span>
                      <strong class="pulse-lb-name">${escapeHtml(p.name)}</strong>
                      <span class="pulse-lb-correct muted-sm">${p.correctCount} / ${quiz.questions.length} correct</span>
                      <strong class="pulse-lb-score">${p.score.toLocaleString()} pts</strong>
                    </div>
                  `,
                  )
                  .join('')
          }
        </div>

        <div class="pulse-stage-cta-row">
          <button type="button" class="btn btn-ghost" data-pulse-action="exit-live-stage">
            &larr; Edit Quiz in Configurator
          </button>
          <div class="pulse-stage-cta-right">
            <button type="button" class="btn btn-secondary" data-pulse-action="reset-and-lobby">
              🔄 Clear Scores &amp; Reopen Queue
            </button>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="pulse-host-shell">
      <div class="pulse-live-topbar card">
        <div class="pulse-live-topbar-left">
          ${PULSE_VECTOR_SVG}
          <span class="chip chip-green">● LIVE WORKSHOP SESSION</span>
          <strong>${escapeHtml(quiz.title)}</strong>
        </div>
        <div class="pulse-live-topbar-right">
          <span class="muted-sm">Join URL: <strong>gpulse.web.app</strong> (Code: <strong class="mono">${escapeHtml(quiz.code)}</strong>)</span>
          <button type="button" class="btn btn-ghost btn-sm" data-pulse-action="exit-live-stage">
            Exit Stage Mode
          </button>
        </div>
      </div>
      ${stageBodyHtml}
    </div>
  `;
}

function subscribeToHostLiveParticipants(quizId: string): void {
  if (unsubHostParticipants) {
    unsubHostParticipants();
    unsubHostParticipants = null;
  }
  unsubHostParticipants = subscribeQuizParticipants(quizId, (list) => {
    liveHostParticipants = list;
    if (liveHostQuizId === quizId) {
      renderPulseHostModule();
    }
  });
}

export function initPulseHostModule(context: PulseHostContext): void {
  hostCtx = context;
  const container = document.getElementById('pulseHostModuleContainer');
  if (!container) return;

  container.addEventListener('submit', async (e) => {
    const form = (e.target as HTMLElement).closest('#pulseConfiguratorForm');
    if (!form) return;
    e.preventDefault();
    syncEditorDomToEditingQuiz();
    if (!editingQuiz) return;
    if (!editingQuiz.title.trim()) {
      editingQuiz.title = 'GDE Live Workshop Quiz';
    }
    hostQuizzes = await upsertPulseQuiz(hostCtx!.getSession(), editingQuiz);
    renderPulseHostModule();
    hostCtx!.showToast(`Saved quiz "${editingQuiz.title}" to database!`);
  });

  container.addEventListener('change', async (e) => {
    const target = e.target as HTMLInputElement;
    if (target.dataset.pulseUploadQ !== undefined) {
      const qIdx = Number(target.dataset.pulseUploadQ);
      const file = target.files?.[0];
      if (!file || !editingQuiz || !editingQuiz.questions[qIdx]) return;
      syncEditorDomToEditingQuiz();
      const compressed = await compressEventPhoto(file);
      editingQuiz.questions[qIdx].imageUrl = compressed.dataUrl;
      renderPulseHostModule();
      hostCtx!.showToast(`Attached image to Question ${qIdx + 1}`);
    }
  });

  container.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-pulse-action]');
    if (!btn || !hostCtx) return;
    const action = btn.dataset.pulseAction;

    if (action === 'new-quiz') {
      editingQuiz = createBlankQuiz(hostCtx.getSession(), hostCtx.getProfile());
      renderPulseHostModule();
      return;
    }

    if (action === 'load-sample') {
      editingQuiz = createSampleWorkshopQuiz(hostCtx.getSession(), hostCtx.getProfile());
      hostQuizzes = await upsertPulseQuiz(hostCtx.getSession(), editingQuiz);
      renderPulseHostModule();
      hostCtx.showToast('Loaded sample GDE workshop quiz!');
      return;
    }

    if (action === 'select-quiz') {
      const id = btn.dataset.quizId || '';
      const found = hostQuizzes.find((q) => q.id === id);
      if (found) {
        editingQuiz = structuredClone(found);
        renderPulseHostModule();
      }
      return;
    }

    if (action === 'delete-quiz') {
      const id = btn.dataset.quizId || '';
      hostQuizzes = await deletePulseQuiz(hostCtx.getSession(), id);
      if (editingQuiz?.id === id) {
        editingQuiz = hostQuizzes[0] ? structuredClone(hostQuizzes[0]) : null;
      }
      renderPulseHostModule();
      hostCtx.showToast('Deleted quiz.');
      return;
    }

    if (action === 'add-question') {
      syncEditorDomToEditingQuiz();
      if (!editingQuiz) return;
      editingQuiz.questions.push(createBlankQuestion(editingQuiz.questions.length + 1));
      renderPulseHostModule();
      return;
    }

    if (action === 'remove-question') {
      syncEditorDomToEditingQuiz();
      const qIdx = Number(btn.dataset.qIdx);
      if (!editingQuiz || editingQuiz.questions.length <= 1) return;
      editingQuiz.questions.splice(qIdx, 1);
      renderPulseHostModule();
      return;
    }

    if (action === 'set-correct-option') {
      syncEditorDomToEditingQuiz();
      const qIdx = Number(btn.dataset.qIdx);
      const optIdx = Number(btn.dataset.optIdx);
      if (editingQuiz?.questions[qIdx]) {
        editingQuiz.questions[qIdx].correctIndex = optIdx;
        renderPulseHostModule();
      }
      return;
    }

    if (action === 'add-option') {
      syncEditorDomToEditingQuiz();
      const qIdx = Number(btn.dataset.qIdx);
      const q = editingQuiz?.questions[qIdx];
      if (q && q.options.length < 4) {
        q.options.push('');
        renderPulseHostModule();
      }
      return;
    }

    if (action === 'remove-option') {
      syncEditorDomToEditingQuiz();
      const qIdx = Number(btn.dataset.qIdx);
      const optIdx = Number(btn.dataset.optIdx);
      const q = editingQuiz?.questions[qIdx];
      if (q && q.options.length > 2) {
        q.options.splice(optIdx, 1);
        if (q.correctIndex >= q.options.length) q.correctIndex = 0;
        renderPulseHostModule();
      }
      return;
    }

    if (action === 'clear-q-image') {
      syncEditorDomToEditingQuiz();
      const qIdx = Number(btn.dataset.qIdx);
      if (editingQuiz?.questions[qIdx]) {
        editingQuiz.questions[qIdx].imageUrl = '';
        renderPulseHostModule();
      }
      return;
    }

    if (action === 'save-and-launch' || action === 'launch-lobby') {
      let targetQuiz: PulseQuiz | undefined;
      if (action === 'save-and-launch') {
        syncEditorDomToEditingQuiz();
        if (!editingQuiz) return;
        if (!editingQuiz.title.trim()) {
          editingQuiz.title = 'GDE Live Workshop Quiz';
        }
        // Ensure options have defaults if left empty
        editingQuiz.questions.forEach((q, idx) => {
          if (!q.prompt.trim()) q.prompt = `Workshop Question ${idx + 1}`;
          q.options = q.options.map((o, oIdx) => o.trim() || `Option ${OPTION_LABELS[oIdx]}`);
        });
        targetQuiz = {
          ...editingQuiz,
          status: 'lobby',
          isActive: true,
          currentQuestionIndex: -1,
          questionStartedAt: 0,
        };
      } else {
        const id = btn.dataset.quizId || '';
        const found = hostQuizzes.find((q) => q.id === id);
        if (!found) return;
        targetQuiz = {
          ...found,
          status: found.status === 'draft' || found.status === 'completed' ? 'lobby' : found.status,
          isActive: true,
          currentQuestionIndex:
            found.status === 'draft' || found.status === 'completed'
              ? -1
              : found.currentQuestionIndex,
        };
      }

      hostQuizzes = await upsertPulseQuiz(hostCtx.getSession(), targetQuiz);
      liveHostQuizId = targetQuiz.id;
      subscribeToHostLiveParticipants(targetQuiz.id);
      renderPulseHostModule();
      hostCtx.showToast(`Live Lobby open! Attendees can join at gpulse.web.app`);
      return;
    }

    if (action === 'copy-short-link') {
      const link = btn.dataset.link || 'https://gpulse.web.app';
      await navigator.clipboard.writeText(link);
      hostCtx.showToast(`Copied ${link} to clipboard!`);
      return;
    }

    if (action === 'exit-live-stage') {
      stopHostTimer();
      if (unsubHostParticipants) {
        unsubHostParticipants();
        unsubHostParticipants = null;
      }
      const prevId = liveHostQuizId;
      liveHostQuizId = null;
      if (prevId) {
        const found = hostQuizzes.find((q) => q.id === prevId);
        if (found) editingQuiz = structuredClone(found);
      }
      renderPulseHostModule();
      return;
    }

    const currentLive = hostQuizzes.find((q) => q.id === liveHostQuizId);
    if (!currentLive) return;

    if (action === 'clear-participants' || action === 'reset-and-lobby') {
      await clearPulseQuizParticipants(currentLive.id);
      const updated: PulseQuiz = {
        ...currentLive,
        status: 'lobby',
        isActive: true,
        currentQuestionIndex: -1,
        questionStartedAt: 0,
      };
      hostQuizzes = await upsertPulseQuiz(hostCtx.getSession(), updated);
      renderPulseHostModule();
      hostCtx.showToast('Queue and scores reset — ready in Lobby!');
      return;
    }

    if (action === 'return-to-lobby') {
      const updated: PulseQuiz = {
        ...currentLive,
        status: 'lobby',
        isActive: true,
        currentQuestionIndex: -1,
        questionStartedAt: 0,
      };
      hostQuizzes = await upsertPulseQuiz(hostCtx.getSession(), updated);
      renderPulseHostModule();
      return;
    }

    if (action === 'start-question') {
      const nextIdx = Number(btn.dataset.qIdx || '0');
      const updated: PulseQuiz = {
        ...currentLive,
        status: 'question',
        isActive: true,
        currentQuestionIndex: nextIdx,
        questionStartedAt: Date.now(),
      };
      hostQuizzes = await upsertPulseQuiz(hostCtx.getSession(), updated);
      renderPulseHostModule();
      return;
    }

    if (action === 'reveal-answer') {
      await advanceLiveQuizToReveal(currentLive);
      return;
    }

    if (action === 'complete-quiz') {
      stopHostTimer();
      const updated: PulseQuiz = {
        ...currentLive,
        status: 'completed',
        isActive: true,
      };
      hostQuizzes = await upsertPulseQuiz(hostCtx.getSession(), updated);
      renderPulseHostModule();
      hostCtx.showToast('Quiz completed! Final leaderboard is live.');
      return;
    }
  });
}

// ============================================================================
// ATTENDEE / PARTICIPANT PORTAL (gpulse.web.app)
// ============================================================================
function stopParticipantTimer(): void {
  if (participantTimerInterval !== null) {
    window.clearInterval(participantTimerInterval);
    participantTimerInterval = null;
  }
}

function startParticipantTimerLoop(): void {
  stopParticipantTimer();
  participantTimerInterval = window.setInterval(() => {
    if (!activeParticipantQuiz || activeParticipantQuiz.status !== 'question') {
      stopParticipantTimer();
      return;
    }
    const q = activeParticipantQuiz.questions[activeParticipantQuiz.currentQuestionIndex];
    if (!q) return;
    const elapsedSec = Math.max(
      0,
      (Date.now() - (activeParticipantQuiz.questionStartedAt || 0)) / 1000,
    );
    const remaining = Math.max(0, Math.ceil(q.timeLimitSec - elapsedSec));
    const pct = Math.max(0, Math.min(100, ((q.timeLimitSec - elapsedSec) / q.timeLimitSec) * 100));

    const timerText = document.getElementById('participantTimerText');
    const timerBar = document.getElementById('participantTimerBar');
    if (timerText) timerText.textContent = `${remaining}s`;
    if (timerBar) timerBar.style.width = `${pct}%`;

    if (remaining <= 0) {
      stopParticipantTimer();
      renderParticipantPortal();
    }
  }, 200);
}

function connectParticipantToCode(
  rawCode: string,
  escapeHtml: (s: string) => string,
): void {
  const cleanCode = (rawCode || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  enteredParticipantCode = cleanCode;
  activeParticipantQuiz = null;
  activeParticipantRecord = null;
  allQuizParticipants = [];
  currentSubscribedQuizId = null;

  if (unsubParticipantQuiz) {
    unsubParticipantQuiz();
    unsubParticipantQuiz = null;
  }
  if (unsubParticipantList) {
    unsubParticipantList();
    unsubParticipantList = null;
  }

  if (!cleanCode) {
    renderParticipantPortal(escapeHtml);
    return;
  }

  unsubParticipantQuiz = subscribeLiveQuizForParticipant(cleanCode, (quiz) => {
    activeParticipantQuiz = quiz;
    if (quiz && quiz.id !== currentSubscribedQuizId) {
      currentSubscribedQuizId = quiz.id;
      if (unsubParticipantList) unsubParticipantList();
      unsubParticipantList = subscribeQuizParticipants(quiz.id, async (list) => {
        allQuizParticipants = list;
        const myUid = await ensureParticipantAuth();
        const mine = list.find((p) => p.uid === myUid) || null;
        activeParticipantRecord = mine;
        renderParticipantPortal(escapeHtml);
      });
    } else if (!quiz) {
      currentSubscribedQuizId = null;
      activeParticipantRecord = null;
      allQuizParticipants = [];
    }
    renderParticipantPortal(escapeHtml);
  });
}

export function initParticipantPortal(
  escapeHtml: (s: string) => string,
  showToast: (msg: string) => void,
): void {
  const view = $('participantView');
  view.hidden = false;
  $('welcomeView').hidden = true;
  $('appHeader').hidden = true;
  $('configView').hidden = true;
  $('dashboardView').hidden = true;

  // Authenticate anonymously in the background immediately (1-tap experience)
  void ensureParticipantAuth();

  const params = new URLSearchParams(window.location.search);
  const initialCode = (params.get('c') || params.get('code') || '').trim();
  connectParticipantToCode(initialCode, escapeHtml);

  view.addEventListener('submit', (e) => {
    const codeForm = (e.target as HTMLElement).closest('#participantCodeForm');
    if (codeForm) {
      e.preventDefault();
      const inp = document.getElementById('participantCodeInput') as HTMLInputElement | null;
      const code = inp ? inp.value.trim().toUpperCase() : '';
      if (!code) {
        showToast('Enter the Workshop Code shown by your GDE host.');
        return;
      }
      connectParticipantToCode(code, escapeHtml);
    }
  });

  view.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-play-action]');
    if (!btn) return;
    const action = btn.dataset.playAction;

    if (action === 'change-code') {
      connectParticipantToCode('', escapeHtml);
      return;
    }

    if (action === 'randomize-name') {
      const inp = document.getElementById('participantNameInput') as HTMLInputElement | null;
      if (inp) {
        inp.value = generateComedicParticipantName();
      }
      return;
    }

    if (action === 'join-queue') {
      if (!activeParticipantQuiz) {
        showToast('Enter a valid Workshop Code first.');
        return;
      }
      const inp = document.getElementById('participantNameInput') as HTMLInputElement | null;
      const rawName = inp ? inp.value.trim() : '';
      btn.disabled = true;
      btn.textContent = 'Joining Queue...';
      try {
        activeParticipantRecord = await joinPulseQuizQueue(activeParticipantQuiz.id, rawName);
        renderParticipantPortal(escapeHtml);
        showToast(`Joined as ${activeParticipantRecord.name}!`);
      } finally {
        btn.disabled = false;
      }
      return;
    }

    if (action === 'select-option') {
      if (
        !activeParticipantQuiz ||
        !activeParticipantRecord ||
        activeParticipantQuiz.status !== 'question' ||
        isSubmittingAnswer
      ) {
        return;
      }
      const qIdx = activeParticipantQuiz.currentQuestionIndex;
      const q = activeParticipantQuiz.questions[qIdx];
      if (!q) return;

      const elapsedMs = Math.max(0, Date.now() - (activeParticipantQuiz.questionStartedAt || 0));
      if (elapsedMs > q.timeLimitSec * 1000 + 1500) {
        showToast('Time is up for this question!');
        renderParticipantPortal(escapeHtml);
        return;
      }

      const selectedIdx = Number(btn.dataset.optIdx);
      const isCorrect = selectedIdx === q.correctIndex;
      const pts = calculatePulseAnswerPoints(isCorrect, elapsedMs, q.timeLimitSec);

      isSubmittingAnswer = true;
      try {
        activeParticipantRecord = await submitPulseQuizAnswer(
          activeParticipantQuiz.id,
          activeParticipantRecord,
          qIdx,
          selectedIdx,
          pts,
          isCorrect,
        );
        renderParticipantPortal(escapeHtml);
      } finally {
        isSubmittingAnswer = false;
      }
    }
  });
}

function renderParticipantPortal(
  escapeHtml: (s: string) => string = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
): void {
  const view = document.getElementById('participantView');
  if (!view || view.hidden) return;

  // Step 0: Blank Code-Entry Screen (never shows all sessions happening across GDEs)
  if (!enteredParticipantCode || !activeParticipantQuiz) {
    stopParticipantTimer();
    view.innerHTML = `
      <div class="pulse-player-card card">
        ${PULSE_VECTOR_SVG}
        <div class="brand-motif-tag">Google Developer Experts &middot; GDE Pulse</div>
        <h1>Enter Workshop Code</h1>
        <p class="muted">
          Enter the code displayed on stage by your GDE host to view your host and join the queue.
        </p>

        <form id="participantCodeForm" class="pulse-join-form">
          <label class="field">
            <span>Workshop Code</span>
            <input
              type="text"
              id="participantCodeInput"
              class="input-lg mono-input"
              maxlength="12"
              value="${escapeHtml(enteredParticipantCode)}"
              placeholder="e.g. GDE42"
              autocomplete="off"
              required
            />
          </label>
          ${
            enteredParticipantCode && !activeParticipantQuiz
              ? `<div class="pulse-feedback-banner is-wrong">No active workshop found for code <strong class="mono">${escapeHtml(enteredParticipantCode)}</strong>. Check the code on your GDE host's screen.</div>`
              : ''
          }
          <button type="submit" class="btn btn-primary btn-lg btn-full">
            Connect to Workshop &rarr;
          </button>
        </form>
      </div>
    `;
    return;
  }

  // Step 1: Code Matched -> Front screen shows Your Host + Workshop Code, then Join Queue
  if (!activeParticipantRecord) {
    stopParticipantTimer();
    const savedName = getSavedParticipantName();
    const suggestedComedic = generateComedicParticipantName();
    view.innerHTML = `
      <div class="pulse-player-card card">
        ${PULSE_VECTOR_SVG}
        <div class="pulse-question-stage-top">
          <span class="chip chip-blue">Host: <strong>${escapeHtml(activeParticipantQuiz.ownerName || 'Google Developer Expert')}</strong></span>
          <span class="chip chip-neutral">Code: <strong class="mono">${escapeHtml(activeParticipantQuiz.code)}</strong></span>
        </div>

        <h1 class="pulse-player-title" style="margin-top:4px">${escapeHtml(activeParticipantQuiz.title)}</h1>

        <div class="pulse-join-form">
          <label class="field">
            <span>Your Display Name (optional — leave blank for a comedic random name!)</span>
            <div class="advocu-key-row">
              <input
                type="text"
                id="participantNameInput"
                class="input-lg"
                maxlength="40"
                value="${escapeHtml(savedName)}"
                placeholder="e.g. ${escapeHtml(suggestedComedic)}"
              />
              <button type="button" class="btn btn-secondary" data-play-action="randomize-name" title="Generate a comedic random name">
                🎲 Random Name
              </button>
            </div>
          </label>

          <button type="button" class="btn btn-primary btn-lg btn-full" data-play-action="join-queue">
            ⚡ Join Queue &rarr;
          </button>
          <button type="button" class="btn btn-ghost btn-sm" data-play-action="change-code">
            &larr; Enter a Different Workshop Code
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Step 2: Joined & Quiz is in Lobby Queue -> Show everyone's names in the queue!
  if (activeParticipantQuiz.status === 'lobby' || activeParticipantQuiz.status === 'draft') {
    stopParticipantTimer();
    const cohortHtml = allQuizParticipants
      .map(
        (p) =>
          `<span class="pulse-participant-chip ${p.uid === activeParticipantRecord?.uid ? 'is-me' : ''}">
            <span class="pulse-participant-dot"></span>
            <strong>${escapeHtml(p.name)}</strong>
            ${p.uid === activeParticipantRecord?.uid ? `<span class="chip chip-blue">You</span>` : ''}
          </span>`,
      )
      .join('');

    view.innerHTML = `
      <div class="pulse-player-card card">
        ${PULSE_VECTOR_SVG}
        <div class="brand-motif-tag">GDE Pulse &middot; In Lobby Queue</div>
        <h2>You're in as <span style="color:var(--sky)">${escapeHtml(activeParticipantRecord.name)}</span>!</h2>
        <p class="muted">
          Waiting for <strong>${escapeHtml(activeParticipantQuiz.ownerName || 'the GDE host')}</strong> to start <strong>${escapeHtml(activeParticipantQuiz.title)}</strong>...
        </p>

        <div class="pulse-queue-box">
          <div class="pulse-queue-header">
            <h3>👥 Workshop Queue (${allQuizParticipants.length} Joined)</h3>
          </div>
          <div class="pulse-participant-cloud">
            ${cohortHtml}
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Step 3: Active Question or Answer Reveal
  if (activeParticipantQuiz.status === 'question' || activeParticipantQuiz.status === 'reveal') {
    const qIdx = Math.max(
      0,
      Math.min(
        activeParticipantQuiz.questions.length - 1,
        activeParticipantQuiz.currentQuestionIndex,
      ),
    );
    const q = activeParticipantQuiz.questions[qIdx];
    const isReveal = activeParticipantQuiz.status === 'reveal';
    const elapsedSec = Math.max(
      0,
      (Date.now() - (activeParticipantQuiz.questionStartedAt || 0)) / 1000,
    );
    const remainingSec = isReveal ? 0 : Math.max(0, Math.ceil(q.timeLimitSec - elapsedSec));
    const isTimeExpired = isReveal || remainingSec <= 0;
    const pct = isTimeExpired
      ? 0
      : Math.max(0, Math.min(100, ((q.timeLimitSec - elapsedSec) / q.timeLimitSec) * 100));

    if (!isTimeExpired) {
      startParticipantTimerLoop();
    } else {
      stopParticipantTimer();
    }

    const myAnswer = activeParticipantRecord.answers?.[String(qIdx)];
    const myRank =
      allQuizParticipants.findIndex((p) => p.uid === activeParticipantRecord?.uid) + 1 || 1;

    const optionsHtml = q.options
      .map((opt, idx) => {
        const isSelected = myAnswer?.selectedIndex === idx;
        const isCorrect = idx === q.correctIndex;
        let stateClass = '';
        if (isReveal || isTimeExpired) {
          if (isCorrect) stateClass = 'is-reveal-correct';
          else if (isSelected) stateClass = 'is-reveal-wrong';
        } else if (isSelected) {
          stateClass = 'is-selected-choice';
        }

        const disabledAttr = myAnswer !== undefined || isTimeExpired ? 'disabled' : '';
        return `
          <button
            type="button"
            class="pulse-player-option-btn opt-color-${idx % 4} ${stateClass}"
            data-play-action="select-option"
            data-opt-idx="${idx}"
            ${disabledAttr}
          >
            <span class="pulse-opt-badge">${OPTION_LABELS[idx] || idx + 1}</span>
            <span class="pulse-stage-option-text">${escapeHtml(opt)}</span>
            ${isSelected ? `<span class="chip chip-blue">Your Pick</span>` : ''}
          </button>
        `;
      })
      .join('');

    let statusBannerHtml = '';
    if (isReveal || isTimeExpired) {
      if (myAnswer?.correct) {
        statusBannerHtml = `<div class="pulse-feedback-banner is-correct">✅ Correct! +${myAnswer.points} pts &middot; Total: ${activeParticipantRecord.score.toLocaleString()} pts (Rank #${myRank})</div>`;
      } else if (myAnswer) {
        statusBannerHtml = `<div class="pulse-feedback-banner is-wrong">❌ Not quite! Correct answer: <strong>${escapeHtml(q.options[q.correctIndex] || '')}</strong> &middot; Score: ${activeParticipantRecord.score.toLocaleString()} pts (Rank #${myRank})</div>`;
      } else {
        statusBannerHtml = `<div class="pulse-feedback-banner is-wrong">⏰ Time's up! Correct answer: <strong>${escapeHtml(q.options[q.correctIndex] || '')}</strong></div>`;
      }
    } else if (myAnswer) {
      statusBannerHtml = `<div class="pulse-feedback-banner is-locked">🔒 Answer locked in! Waiting for timer / reveal...</div>`;
    }

    view.innerHTML = `
      <div class="pulse-player-card card">
        ${PULSE_VECTOR_SVG}
        <div class="pulse-question-stage-top">
          <div>
            <span class="step-pill">Q${qIdx + 1} of ${activeParticipantQuiz.questions.length}</span>
            <span class="chip chip-neutral">${escapeHtml(activeParticipantRecord.name)} &middot; ${activeParticipantRecord.score.toLocaleString()} pts</span>
          </div>
          <div class="pulse-timer-pill ${isTimeExpired ? 'is-ended' : ''}">
            <strong id="participantTimerText">${isTimeExpired ? '0s' : `${remainingSec}s`}</strong>
          </div>
        </div>

        <div class="pulse-timer-bar-track">
          <div id="participantTimerBar" class="pulse-timer-bar-fill" style="width: ${pct}%"></div>
        </div>

        <h2 class="pulse-player-prompt">${escapeHtml(q.prompt)}</h2>

        ${
          isValidPulseImageUrl(q.imageUrl)
            ? `<div class="pulse-stage-image-wrap">
                <img src="${escapeHtml(q.imageUrl!)}" alt="" class="pulse-stage-image" onerror="this.parentElement.hidden=true" />
              </div>`
            : ''
        }

        <div class="pulse-player-options-grid">
          ${optionsHtml}
        </div>

        ${statusBannerHtml}
      </div>
    `;
    return;
  }

  // Step 4: Quiz Completed -> Show Final Rank, Score & Podium!
  stopParticipantTimer();
  const myRank =
    allQuizParticipants.findIndex((p) => p.uid === activeParticipantRecord?.uid) + 1 || 1;
  const topListHtml = allQuizParticipants
    .slice(0, 10)
    .map(
      (p, idx) => `
      <div class="pulse-leaderboard-row ${p.uid === activeParticipantRecord?.uid ? 'is-first' : ''}">
        <span class="pulse-rank-badge">#${idx + 1}</span>
        <strong class="pulse-lb-name">${escapeHtml(p.name)} ${p.uid === activeParticipantRecord?.uid ? '(You)' : ''}</strong>
        <span class="pulse-lb-correct muted-sm">${p.correctCount}/${activeParticipantQuiz!.questions.length}</span>
        <strong class="pulse-lb-score">${p.score.toLocaleString()} pts</strong>
      </div>
    `,
    )
    .join('');

  view.innerHTML = `
    <div class="pulse-player-card card">
      ${PULSE_VECTOR_SVG}
      <div class="brand-motif-tag">GDE Pulse &middot; Final Results</div>
      <h2>🏆 You finished #${myRank} of ${allQuizParticipants.length}!</h2>
      <p class="muted">
        <strong>${escapeHtml(activeParticipantRecord.name)}</strong> &middot;
        <strong>${activeParticipantRecord.score.toLocaleString()} pts</strong>
        (${activeParticipantRecord.correctCount} / ${activeParticipantQuiz.questions.length} correct)
      </p>

      <div class="pulse-leaderboard-list" style="margin-top:16px">
        ${topListHtml}
      </div>
    </div>
  `;
}
