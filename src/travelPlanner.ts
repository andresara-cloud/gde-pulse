import {
  type AuthSession,
  removeEvent,
  upsertEvent,
  upsertEventsBatch,
} from './firebase.ts';
import {
  compressEventPhoto,
  type DiscoveredEvent,
  extractEventFromUrl,
  fetchLiveGdgEvents,
  getSpeakerMatchingSessions,
  OFFLINE_DEVFEST_FALLBACK,
  parseAdvocuMyEventsTable,
  parseSmartImport,
  submitToAdvocu,
} from './integrations.ts';
import {
  type ActivityType,
  type CfpPlatform,
  calculateBudgetUsd,
  detectConflicts,
  type EventCampaign,
  type EventPhoto,
  type EventStatus,
  evaluateTravelWorkflow,
  type GdeEvent,
  type GdeProfile,
  isActiveAppliedEvent,
  isActiveConfirmedEvent,
  matchDiscoverWithItinerary,
  resolveRegion,
} from './policy.ts';

export interface TravelPlannerContext {
  getSession: () => AuthSession | null;
  getProfile: () => GdeProfile;
  getEvents: () => GdeEvent[];
  setEvents: (next: GdeEvent[]) => void;
  showToast: (msg: string) => void;
  escapeHtml: (str: string) => string;
  switchToConfigForAdvocuKey: () => void;
}

const $ = <T extends HTMLElement = HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

let ctx: TravelPlannerContext;
let discoveredEvents: DiscoveredEvent[] = [...OFFLINE_DEVFEST_FALLBACK];
let activeFilter: string = 'all';
let itineraryViewMode: 'workflow' | 'calendar' = 'workflow';
let activeDiscoverSource: string = 'ALL';
let activeAdvocuPhotos: EventPhoto[] = [];

function isAdvocuReminderEvent(ev: GdeEvent, todayIso: string): boolean {
  if (ev.advocuSynced) return false;
  if (ev.status === 'Declined') return false;
  if (ev.status === 'Completed') return true;
  const evDate = (ev.endDate || ev.startDate || '').slice(0, 10);
  if (isActiveConfirmedEvent(ev) && evDate && evDate < todayIso) {
    return true;
  }
  return false;
}

export function renderTravelPlanner(): void {
  if (!ctx) return;
  renderKpisAndItinerary();
  renderDiscover();
}

export function renderKpisAndItinerary(): void {
  if (!ctx) return;
  const events = ctx.getEvents();
  const escapeHtml = ctx.escapeHtml;
  const conflictsMap = detectConflicts(events);
  const activeEvents = events.filter((e) => e.status !== 'Completed' && e.status !== 'Declined');
  const confirmedCount = events.filter((e) => isActiveConfirmedEvent(e)).length;
  const appliedCount = events.filter((e) => isActiveAppliedEvent(e)).length;
  const completedCount = events.filter((e) => e.status === 'Completed').length;
  const todayIso = new Date().toLocaleDateString('sv-SE');
  const advocuReminderCount = events.filter((ev) => isAdvocuReminderEvent(ev, todayIso)).length;
  let conflictEventsCount = 0;
  let wtApprovedCount = 0;
  let wtRequestedCount = 0;
  let reimburseAlertCount = 0;

  for (const ev of activeEvents) {
    if ((conflictsMap.get(ev.id) ?? []).length > 0) conflictEventsCount++;
    if (ev.worktripsRequested ?? ev.travelApprovalStatus !== 'Not Submitted') wtRequestedCount++;
    if (ev.worktripsApproved ?? ev.travelApprovalStatus === 'Approved') wtApprovedCount++;
    const wf = evaluateTravelWorkflow(ev);
    if (wf.isRedAlert || wf.reimbursementState === 'window-open') {
      reimburseAlertCount++;
    }
  }

  $('kpiTotal').textContent = String(activeEvents.length);
  $('kpiTotalSub').textContent = `${confirmedCount} confirmed · ${appliedCount} applied · ${completedCount} archived`;
  $('kpiConflicts').textContent = String(conflictEventsCount);
  $('kpiWorktrips').textContent = String(wtApprovedCount);
  $('kpiWorktripsSub').textContent = `${wtRequestedCount} requested · ${wtApprovedCount} approved`;
  $('kpiReimburse').textContent = String(reimburseAlertCount);

  const advocuPill = document.getElementById('pillAdvocuReminder');
  if (advocuPill) {
    advocuPill.classList.toggle('has-amber-alert', advocuReminderCount > 0);
    advocuPill.innerHTML =
      advocuReminderCount > 0
        ? `<span class="pill-bang" aria-hidden="true">!</span><span>Advocu Reminder (${advocuReminderCount})</span>`
        : `Advocu Reminder`;
  }

  const listEl = $('itineraryList');
  const filtered = events
    .filter((ev) => {
      if (activeFilter === 'all') {
        return ev.status !== 'Completed' && ev.status !== 'Declined';
      }
      if (activeFilter === 'Confirmed') return isActiveConfirmedEvent(ev);
      if (activeFilter === 'Applied') return isActiveAppliedEvent(ev);
      if (activeFilter === 'Completed') return ev.status === 'Completed';
      if (activeFilter === 'Declined') return ev.status === 'Declined';
      if (activeFilter === 'AdvocuReminder') return isAdvocuReminderEvent(ev, todayIso);
      if (activeFilter === 'conflicts') {
        return (
          ev.status !== 'Completed' &&
          ev.status !== 'Declined' &&
          (conflictsMap.get(ev.id) ?? []).length > 0
        );
      }
      if (activeFilter === 'reimbursement') {
        const wf = evaluateTravelWorkflow(ev);
        return wf.isRedAlert || wf.reimbursementState === 'window-open';
      }
      return true;
    })
    .sort((a, b) => {
      if (
        activeFilter === 'Completed' ||
        activeFilter === 'Declined' ||
        activeFilter === 'AdvocuReminder'
      ) {
        return b.startDate.localeCompare(a.startDate);
      }
      return a.startDate.localeCompare(b.startDate);
    });

  const calEl = $('itineraryCalendar');
  const toggleBtn = $('btnToggleItineraryView');
  const calendarIconSvg = `<svg class="itinerary-toggle-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><rect x="7" y="14" width="3" height="3" rx="0.5"></rect><rect x="14" y="14" width="3" height="3" rx="0.5"></rect></svg>`;
  const workflowIconSvg = `<svg class="itinerary-toggle-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="6" height="6" rx="1"></rect><path d="M5 7l1.5 1.5L9 6"></path><line x1="13" y1="7" x2="21" y2="7"></line><rect x="3" y="14" width="6" height="6" rx="1"></rect><line x1="13" y1="17" x2="21" y2="17"></line></svg>`;
  toggleBtn.innerHTML =
    itineraryViewMode === 'calendar'
      ? `${workflowIconSvg}<span>Switch to Workflow View</span>`
      : `${calendarIconSvg}<span>Switch to Calendar View</span>`;
  listEl.hidden = itineraryViewMode === 'calendar';
  calEl.hidden = itineraryViewMode !== 'calendar';

  if (filtered.length === 0) {
    const emptyHtml =
      activeFilter === 'AdvocuReminder'
        ? `<div class="card muted">🎉 All caught up! No events currently require an Advocu activity report.</div>`
        : `<div class="card muted">No events in this view. Click <strong>+ Add Event</strong> or check the <strong>Completed (Archive)</strong> tab for past activities.</div>`;
    listEl.innerHTML = emptyHtml;
    calEl.innerHTML = emptyHtml;
    return;
  }

  const showOverlapRedAlert =
    activeFilter === 'Applied' || activeFilter === 'Confirmed' || activeFilter === 'conflicts';

  listEl.innerHTML = filtered
    .map((ev) => {
      const evConflicts = showOverlapRedAlert ? (conflictsMap.get(ev.id) ?? []) : [];
      const wf = evaluateTravelWorkflow(ev);

      const evApplied = Boolean(
        ev.eventApplied ??
          (ev.status === 'Applied' ||
            ev.status === 'Confirmed' ||
            ev.status === 'Completed' ||
            ev.status === 'Declined'),
      );
      const evApproved = Boolean(
        ev.eventApproved ?? (ev.status === 'Confirmed' || ev.status === 'Completed'),
      );
      const wtReq = Boolean(ev.worktripsRequested ?? ev.travelApprovalStatus !== 'Not Submitted');
      const wtApp = Boolean(ev.worktripsApproved ?? ev.travelApprovalStatus === 'Approved');
      const bdgVal = [600, 800, 1200, 0].includes(Number(ev.budgetUsd)) ? Number(ev.budgetUsd) : 800;
      const publicUrl = ev.eventUrl || ev.cfpUrl;

      const conflictBadges = evConflicts
        .map(
          (c) =>
            `<span class="chip ${c.severity === 'overlap' ? 'chip-red' : 'chip-amber'}">${escapeHtml(c.message)}</span>`,
        )
        .join('');

      const editPenSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
      const deleteTrashSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;

      if (ev.status === 'Completed') {
        return `
          <article class="event-card is-completed-card">
            <div class="event-top">
              <div class="event-title-group">
                <div class="event-meta-row" style="margin-bottom:2px">
                  <span class="chip chip-green">Completed</span>
                  ${ev.advocuSynced ? `<span class="chip chip-blue">Advocu Reported</span>` : `<span class="chip chip-amber" title="Requires Advocu report">! Advocu Reminder</span>`}
                  <span>📍 <strong>${escapeHtml(ev.city ? `${ev.city}, ` : '')}${escapeHtml(ev.country)}</strong></span>
                  ${ev.startDate ? `<span>&middot; ${escapeHtml(ev.startDate)}</span>` : ''}
                  <span>&middot; ${bdgVal === 0 ? 'N/A' : `$${bdgVal.toLocaleString()} USD`}</span>
                  ${publicUrl ? `<a href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener">Event Page &nearr;</a>` : ''}
                </div>
                <div class="event-title">${escapeHtml(ev.title)}</div>
                <div class="event-session">
                  ${escapeHtml(ev.sessionTitle || 'Click Edit to set talk / session name')}
                </div>
              </div>

              <div class="event-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-action="advocu" data-id="${escapeHtml(ev.id)}">
                  Advocu
                </button>
                <button type="button" class="btn btn-ghost btn-sm" data-action="undo-step" data-id="${escapeHtml(ev.id)}" title="Move back to Active & Upcoming">
                  ↺ Reopen
                </button>
                <button type="button" class="btn btn-ghost btn-sm btn-icon-action" data-action="edit" data-id="${escapeHtml(ev.id)}" title="Edit Event" aria-label="Edit Event">
                  ${editPenSvg}
                </button>
                <button type="button" class="btn btn-danger-ghost btn-sm btn-icon-action" data-action="delete" data-id="${escapeHtml(ev.id)}" title="Delete Event" aria-label="Delete Event">
                  ${deleteTrashSvg}
                </button>
              </div>
            </div>
            <div class="event-mobile-footer">
              <button type="button" class="btn btn-secondary btn-sm" data-action="advocu" data-id="${escapeHtml(ev.id)}">
                Advocu
              </button>
              <button type="button" class="btn btn-ghost btn-sm" data-action="undo-step" data-id="${escapeHtml(ev.id)}" title="Move back to Active & Upcoming">
                ↺ Reopen
              </button>
              <button type="button" class="btn btn-ghost btn-sm btn-icon-action" data-action="edit" data-id="${escapeHtml(ev.id)}" title="Edit Event" aria-label="Edit Event">
                ${editPenSvg}
              </button>
              <button type="button" class="btn btn-danger-ghost btn-sm btn-icon-action" data-action="delete" data-id="${escapeHtml(ev.id)}" title="Delete Event" aria-label="Delete Event">
                ${deleteTrashSvg}
              </button>
            </div>
          </article>
        `;
      }

      const currentStage = wtApp ? 4 : wtReq ? 3 : evApproved ? 2 : evApplied ? 1 : 0;
      const stageClass = (stageNum: number) =>
        currentStage >= stageNum
          ? 'step-node is-done'
          : currentStage + 1 === stageNum
            ? 'step-node is-next'
            : 'step-node is-upcoming';

      const hasReimburseDate = Boolean((ev.reimbursementSubmittedDate || '').trim());
      const showReimburseRow =
        ev.reimbursementSubmitted || hasReimburseDate || activeFilter === 'reimbursement';
      const showBookingToggles =
        currentStage >= 2 || ev.flightBooked || ev.hotelBooked || showReimburseRow || hasReimburseDate;

      const reimburseChipClass = wf.isRedAlert
        ? 'chip-red'
        : wf.reimbursementState === 'submitted-on-time'
          ? 'chip-green'
          : wf.reimbursementState === 'window-open'
            ? 'chip-amber'
            : 'chip-neutral';

      const topAlertsHtml =
        ev.advocuSynced || conflictBadges
          ? `<div class="event-badges">
              ${ev.advocuSynced ? `<span class="chip chip-green">Advocu Reported</span>` : ''}
              ${conflictBadges}
            </div>`
          : '';

      return `
        <article class="event-card ${evConflicts.length ? 'has-conflict' : ''} ${wf.isRedAlert ? 'is-red-flagged' : ''}">
          <div class="event-top">
            <div class="event-title-group">
              ${topAlertsHtml}
              <div class="event-title">${escapeHtml(ev.title)}</div>
              <div class="event-session">
                ${escapeHtml(ev.sessionTitle || 'Click Edit to set talk / session name')}
              </div>
              <div class="event-meta-row">
                <span>📍 <strong>${escapeHtml(ev.city ? `${ev.city}, ` : '')}${escapeHtml(ev.country)}</strong></span>
                ${publicUrl ? `<a href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener">Event Page &nearr;</a>` : ''}
              </div>
              <div class="event-inline-controls">
                <input
                  type="date"
                  class="reimburse-date-inline"
                  data-event-date-id="${escapeHtml(ev.id)}"
                  value="${escapeHtml(ev.startDate || '')}"
                  aria-label="Event Date"
                  title="Event Date"
                />
                <select id="bdg-${escapeHtml(ev.id)}" class="budget-select-inline" data-budget-id="${escapeHtml(ev.id)}" aria-label="Event Budget">
                  <option value="600" ${bdgVal === 600 ? 'selected' : ''}>$600 USD</option>
                  <option value="800" ${bdgVal === 800 ? 'selected' : ''}>$800 USD</option>
                  <option value="1200" ${bdgVal === 1200 ? 'selected' : ''}>$1,200 USD</option>
                  <option value="0" ${bdgVal === 0 ? 'selected' : ''}>N/A</option>
                </select>
              </div>
            </div>

            <div class="event-header-right">
              <div class="event-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-action="advocu" data-id="${escapeHtml(ev.id)}">
                  Advocu
                </button>
                <button type="button" class="btn btn-ghost btn-sm btn-icon-action" data-action="edit" data-id="${escapeHtml(ev.id)}" title="Edit Event" aria-label="Edit Event">
                  ${editPenSvg}
                </button>
                <button type="button" class="btn btn-danger-ghost btn-sm btn-icon-action" data-action="delete" data-id="${escapeHtml(ev.id)}" title="Delete Event" aria-label="Delete Event">
                  ${deleteTrashSvg}
                </button>
              </div>
              ${
                showReimburseRow
                  ? `<span class="chip ${reimburseChipClass}">${escapeHtml(wf.reimbursementMessage)}</span>`
                  : ''
              }
            </div>
          </div>

          <div class="wt-pipeline-bar">
            <div class="wt-pipeline-steps">
              <button type="button" class="${stageClass(1)}" data-action="set-stage" data-id="${escapeHtml(ev.id)}" data-stage="1" title="Step 1: Event Applied (click to set or step back)">
                1. Applied
              </button>
              <button type="button" class="${stageClass(2)}" data-action="set-stage" data-id="${escapeHtml(ev.id)}" data-stage="2" title="Step 2: Event Approved (click to set or step back)">
                2. Approved
              </button>
              <button type="button" class="${stageClass(3)}" data-action="set-stage" data-id="${escapeHtml(ev.id)}" data-stage="3" title="Step 3: WorkTrips Requested (click to set or step back)">
                3. WorkTrips Requested
              </button>
              <button type="button" class="${stageClass(4)}" data-action="set-stage" data-id="${escapeHtml(ev.id)}" data-stage="4" title="Step 4: WorkTrips Approved (click to set or step back)">
                4. WorkTrips Approved
              </button>
            </div>

            ${
              showBookingToggles
                ? `
            <div class="wt-pipeline-toggles">
              <button
                type="button"
                class="pill-toggle ${ev.flightBooked ? 'is-on' : ''}"
                data-action="toggle-field"
                data-id="${escapeHtml(ev.id)}"
                data-field="flightBooked"
                title="Toggle flight booked"
              >
                ✈️ Flight Booked
              </button>
              <button
                type="button"
                class="pill-toggle ${ev.hotelBooked ? 'is-on' : ''}"
                data-action="toggle-field"
                data-id="${escapeHtml(ev.id)}"
                data-field="hotelBooked"
                title="Toggle hotel booked"
              >
                🏨 Hotel Booked
              </button>
              ${
                hasReimburseDate
                  ? `
              <button
                type="button"
                class="step-node is-next"
                data-action="advance-step"
                data-id="${escapeHtml(ev.id)}"
                data-step="reimbursementReceived"
                title="Mark Reimbursement Received & Move to Completed"
              >
                Reimbursement Received
              </button>
              <input
                type="date"
                class="reimburse-date-inline ${wf.isRedAlert ? 'is-red' : ''}"
                data-reimburse-date-id="${escapeHtml(ev.id)}"
                value="${escapeHtml(ev.reimbursementSubmittedDate || '')}"
                aria-label="Reimbursement Submitted Date"
                title="Reimbursement Submitted Date"
              />`
                  : `
              <button
                type="button"
                class="pill-toggle ${ev.reimbursementSubmitted ? 'is-on' : ''}"
                data-action="toggle-field"
                data-id="${escapeHtml(ev.id)}"
                data-field="reimbursementSubmitted"
                title="Optional: Click to enter reimbursement submitted date"
              >
                🧾 Reimbursement Submitted
              </button>
              ${
                ev.reimbursementSubmitted
                  ? `<input
                      type="date"
                      class="reimburse-date-inline ${wf.isRedAlert ? 'is-red' : ''}"
                      data-reimburse-date-id="${escapeHtml(ev.id)}"
                      value="${escapeHtml(ev.reimbursementSubmittedDate || '')}"
                      aria-label="Reimbursement Submitted Date"
                      title="Enter Reimbursement Submitted Date"
                    />`
                  : ''
              }`
              }
              <button
                type="button"
                class="step-node is-next"
                data-action="advance-step"
                data-id="${escapeHtml(ev.id)}"
                data-step="markCompleted"
                title="Mark Event Completed & Move to Completed (Archive)"
              >
                Event Completed
              </button>
            </div>`
                : ''
            }
          </div>

          <div class="event-mobile-footer">
            <button type="button" class="btn btn-secondary btn-sm" data-action="advocu" data-id="${escapeHtml(ev.id)}">
              Advocu
            </button>
            <button type="button" class="btn btn-ghost btn-sm btn-icon-action" data-action="edit" data-id="${escapeHtml(ev.id)}" title="Edit Event" aria-label="Edit Event">
              ${editPenSvg}
            </button>
            <button type="button" class="btn btn-danger-ghost btn-sm btn-icon-action" data-action="delete" data-id="${escapeHtml(ev.id)}" title="Delete Event" aria-label="Delete Event">
              ${deleteTrashSvg}
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  renderItineraryCalendar(filtered);
  renderDiscover();
}

function renderItineraryCalendar(filtered: GdeEvent[]): void {
  const calEl = $('itineraryCalendar');
  const escapeHtml = ctx.escapeHtml;
  const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const byDate = new Map<string, GdeEvent[]>();
  const byMonthCount = new Map<string, number>();

  for (const ev of filtered) {
    const dateKey = (ev.startDate || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
    const list = byDate.get(dateKey) ?? [];
    list.push(ev);
    byDate.set(dateKey, list);

    const ymKey = dateKey.slice(0, 7);
    byMonthCount.set(ymKey, (byMonthCount.get(ymKey) ?? 0) + 1);
  }

  let monthKeys = Array.from(byMonthCount.keys());
  const isArchiveView = activeFilter === 'Completed' || activeFilter === 'Declined';

  if (monthKeys.length === 0) {
    calEl.innerHTML = `<div class="card muted">No dated events in this view.</div>`;
    return;
  }

  if (isArchiveView) {
    monthKeys.sort((a, b) => b.localeCompare(a));
  } else {
    monthKeys.sort((a, b) => a.localeCompare(b));
    const firstYm = monthKeys[0];
    const lastYm = monthKeys[monthKeys.length - 1];
    const [startY, startM] = firstYm.split('-').map(Number);
    const [endY, endM] = lastYm.split('-').map(Number);
    const totalMonths = (endY - startY) * 12 + (endM - startM) + 1;
    if (totalMonths > 1 && totalMonths <= 12) {
      const continuous: string[] = [];
      let y = startY;
      let m = startM;
      for (let i = 0; i < totalMonths; i++) {
        continuous.push(`${y}-${String(m).padStart(2, '0')}`);
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
      monthKeys = continuous;
    }
  }

  const todayIso = new Date().toLocaleDateString('sv-SE');

  calEl.innerHTML = monthKeys
    .map((ym) => {
      const [yearStr, monthStr] = ym.split('-');
      const year = Number(yearStr);
      const monthIdx = Number(monthStr) - 1;
      const monthName = MONTH_NAMES[monthIdx] || ym;
      const sessionCount = byMonthCount.get(ym) ?? 0;

      const firstDayUtc = new Date(Date.UTC(year, monthIdx, 1));
      const startOffset = (firstDayUtc.getUTCDay() + 6) % 7;
      const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
      const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

      const cellsHtml: string[] = [];
      for (let i = 0; i < totalCells; i++) {
        const dayNum = i - startOffset + 1;
        if (dayNum < 1 || dayNum > daysInMonth) {
          cellsHtml.push(`<div class="cal-day-cell is-outside" aria-hidden="true"></div>`);
          continue;
        }
        const dateIso = `${yearStr}-${monthStr}-${String(dayNum).padStart(2, '0')}`;
        const dayEvents = byDate.get(dateIso) ?? [];
        const isToday = dateIso === todayIso;

        const eventsHtml = dayEvents
          .map((ev) => {
            const isConfirmed = Boolean(
              ev.eventApproved ?? (ev.status === 'Confirmed' || ev.status === 'Completed'),
            );
            const statusLetter = isConfirmed ? 'C' : 'A';
            const statusLabel = isConfirmed ? 'Confirmed' : 'Applied';
            const sessionDisplay = ev.sessionTitle?.trim() || ev.title;
            const tooltip = `${ev.title} — ${sessionDisplay} (${ev.city ? `${ev.city}, ` : ''}${ev.country}) · ${statusLabel}`;

            return `
              <div
                class="cal-event-item ${isConfirmed ? 'is-confirmed' : 'is-applied'}"
                data-cal-edit-id="${escapeHtml(ev.id)}"
                title="${escapeHtml(tooltip)}"
              >
                <div class="cal-event-top">
                  <button
                    type="button"
                    class="cal-status-btn ${isConfirmed ? 'is-confirmed' : 'is-applied'}"
                    data-cal-status-id="${escapeHtml(ev.id)}"
                    title="${statusLabel} — click to toggle A (Applied) / C (Confirmed)"
                    aria-label="${statusLabel}"
                  >${statusLetter}</button>
                  <span class="cal-event-country">${escapeHtml(ev.country)}</span>
                </div>
                <div class="cal-event-session">${escapeHtml(sessionDisplay)}</div>
              </div>
            `;
          })
          .join('');

        cellsHtml.push(`
          <div class="cal-day-cell ${dayEvents.length > 0 ? 'has-events' : ''} ${isToday ? 'is-today' : ''}">
            <div class="cal-day-num">${dayNum}</div>
            <div class="cal-day-events">${eventsHtml}</div>
          </div>
        `);
      }

      return `
        <section class="cal-month-card card">
          <div class="cal-month-header">
            <h3 class="cal-month-title">${escapeHtml(monthName)} ${year}</h3>
            <span class="chip chip-neutral">${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'}</span>
          </div>
          <div class="cal-weekdays" aria-hidden="true">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
          <div class="cal-days-grid">
            ${cellsHtml.join('')}
          </div>
        </section>
      `;
    })
    .join('');
}

export function renderDiscover(): void {
  if (!ctx) return;
  const events = ctx.getEvents();
  const currentProfile = ctx.getProfile();
  const escapeHtml = ctx.escapeHtml;
  const query = $<HTMLInputElement>('discoverSearch').value.trim().toLowerCase();
  const regionFilter = $<HTMLSelectElement>('discoverRegion').value;
  const grid = $('discoverList');
  const fallbackRegion = currentProfile.homeRegion || 'Europe';

  const items = discoveredEvents.filter((d) => {
    const evRegion = d.region || resolveRegion(d.country, fallbackRegion, d.countryCode);
    const evSource = d.source || 'Live GDG';
    if (regionFilter !== 'ALL' && evRegion !== regionFilter) return false;
    if (activeDiscoverSource !== 'ALL' && evSource !== activeDiscoverSource) return false;
    if (
      query &&
      !`${d.title} ${d.city} ${d.country} ${d.chapterTitle} ${d.techFocus || ''} ${d.description || ''}`
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }
    return true;
  });

  const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  grid.innerHTML = items
    .map((d) => {
      const match = matchDiscoverWithItinerary(d, events);

      let monthYearChip = '';
      if (d.startDate) {
        const ymMatch = /^(\d{4})-(\d{2})/.exec(d.startDate);
        if (ymMatch) {
          const year = ymMatch[1];
          const monthIdx = Number(ymMatch[2]) - 1;
          const monthName = MONTH_NAMES[monthIdx];
          if (monthName) {
            monthYearChip = `<span class="chip chip-blue">${monthName} ${year}</span>`;
          }
        }
      }

      const sourceBadgeLabel =
        d.source === 'EMEA Conference'
          ? '3rd-Party Conf'
          : d.source === 'Non-GDG Community'
            ? 'Non-GDG Community'
            : d.source === 'EMEA GDG Chapter'
              ? 'GDG Chapter'
              : d.campaign;

      const itineraryStatusChip =
        match.matchedStatus === 'Confirmed'
          ? `<span class="chip chip-green">&#10003; Confirmed</span>`
          : match.matchedStatus === 'Applied'
            ? `<span class="chip chip-amber">&#10003; Applied</span>`
            : match.matchedStatus === 'Considering'
              ? `<span class="chip chip-blue">In Itinerary</span>`
              : '';

      const clashChips = match.clashesWithConfirmed
        .map(
          (confTitle) =>
            `<span class="chip chip-red">&#9888;&#65039; Clashes with ${escapeHtml(confTitle)}</span>`,
        )
        .join('');

      const todayLocal = new Date().toLocaleDateString('sv-SE');
      const isInProgress = Boolean(
        d.isInProgress ||
          (d.startDate &&
            d.startDate <= todayLocal &&
            (d.endDate || d.startDate) >= todayLocal),
      );
      const hasFutureDeadline = Boolean(
        d.cfpDeadline &&
          /^\d{4}-\d{2}-\d{2}$/.test(d.cfpDeadline) &&
          d.cfpDeadline >= todayLocal,
      );
      const isCfpOpen = d.cfpStatus === 'OPEN' && !isInProgress && hasFutureDeadline;

      const inProgressChip = isInProgress
        ? `<span class="chip chip-neutral">Happening now</span>`
        : '';

      const cfpChip = isCfpOpen
        ? `<span class="chip chip-green">CFP OPEN &middot; closes ${escapeHtml(d.cfpDeadline || '')}</span>`
        : '';

      const techChip = d.techFocus
        ? `<span class="chip chip-neutral">${escapeHtml(d.techFocus)}</span>`
        : '';

      const dateOrCadence = d.startDate
        ? d.endDate && d.endDate !== d.startDate
          ? `${d.startDate} &rarr; ${d.endDate}`
          : d.startDate
        : d.cadence || d.chapterTitle;

      const hasSeparateCfp = Boolean(
        d.cfpUrl && d.cfpUrl !== d.url && d.cfpStatus !== 'CLOSED' && !isInProgress,
      );
      const addButtonLabel =
        match.matchedStatus === 'Confirmed'
          ? '&#10003; Confirmed (+ Session)'
          : match.matchedStatus === 'Applied'
            ? '&#10003; Applied (+ Session)'
            : '+ Add to Itinerary';

      return `
        <article class="discover-card">
          <div>
            <div class="event-badges" style="margin-bottom:8px">
              ${monthYearChip}
              ${itineraryStatusChip}
              ${clashChips}
              <span class="chip chip-neutral">${escapeHtml(sourceBadgeLabel)}</span>
              ${inProgressChip}
              ${cfpChip}
              ${techChip}
            </div>
            <h3 style="font-size:1.02rem;margin-bottom:4px">${escapeHtml(d.title)}</h3>
            <p class="muted-sm">${escapeHtml(d.city ? `${d.city}, ` : '')}${escapeHtml(d.country)} &middot; ${dateOrCadence}</p>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
            <div style="display:flex;gap:10px;align-items:center">
              <a href="${escapeHtml(d.url)}" target="_blank" rel="noopener" class="muted-sm">Event Page &nearr;</a>
              ${
                hasSeparateCfp
                  ? `<a href="${escapeHtml(d.cfpUrl || '')}" target="_blank" rel="noopener" class="muted-sm" style="color:var(--sky);font-weight:600">CFP Link &nearr;</a>`
                  : ''
              }
            </div>
            <button type="button" class="btn btn-secondary btn-sm" data-discover-id="${escapeHtml(d.externalId)}">
              ${addButtonLabel}
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

function renderSessionSuggestions(): void {
  const datalist = document.getElementById('advocuSessionsDatalist');
  const chipsContainer = document.getElementById('evSessionSuggestions');
  const sessions = getSpeakerMatchingSessions(ctx.getEvents());
  const escapeHtml = ctx.escapeHtml;

  if (datalist) {
    datalist.innerHTML = sessions
      .map((title) => `<option value="${escapeHtml(title)}"></option>`)
      .join('');
  }

  if (chipsContainer) {
    if (sessions.length === 0) {
      chipsContainer.innerHTML = `<span class="muted-sm">No previous talks yet — type your session name above.</span>`;
    } else {
      chipsContainer.innerHTML =
        `<span class="muted-sm" style="margin-right:4px">Recent talks:</span>` +
        sessions
          .slice(0, 8)
          .map(
            (title) =>
              `<button type="button" class="session-suggestion-chip" data-session-title="${escapeHtml(title)}">${escapeHtml(title)}</button>`,
          )
          .join('');
    }
  }
}

async function handleEventUrlAutoFill(): Promise<void> {
  const urlInput = $<HTMLInputElement>('evEventUrl');
  const rawUrl = urlInput.value.trim();
  const statusBanner = $('evUrlStatusBanner');
  const btn = $<HTMLButtonElement>('btnAutoFillEventUrl');

  if (!rawUrl) {
    statusBanner.textContent = 'Paste an event or CFP URL above first.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Fetching URL...';
  statusBanner.textContent = 'Inspecting event page and extracting details...';

  try {
    const res = await extractEventFromUrl(rawUrl, ctx.getProfile());
    urlInput.value = res.eventUrl;
    if (res.title) $<HTMLInputElement>('evTitle').value = res.title;
    if (res.startDate) $<HTMLInputElement>('evStartDate').value = res.startDate;
    if (res.endDate) $<HTMLInputElement>('evEndDate').value = res.endDate;
    if (res.city) $<HTMLInputElement>('evCity').value = res.city;
    if (res.country) $<HTMLInputElement>('evCountry').value = res.country;
    $<HTMLSelectElement>('evCampaign').value = res.campaign;
    $<HTMLSelectElement>('evCfpPlatform').value = res.cfpPlatform;
    $<HTMLSelectElement>('evBudgetUsd').value = String(res.budgetUsd);

    statusBanner.textContent = res.ok
      ? `✓ ${res.message} — Now select or type your Session Name in Step 2.`
      : res.message;

    $<HTMLInputElement>('evSessionTitle').focus();
  } finally {
    btn.disabled = false;
    btn.textContent = 'Auto-Fill Details';
  }
}

export function openEventModal(ev?: GdeEvent): void {
  const currentProfile = ctx.getProfile();
  $<HTMLInputElement>('evId').value = ev?.id || '';
  $('eventModalTitle').textContent = ev ? `Edit Event: ${ev.title}` : 'Add GDE Event';
  $<HTMLInputElement>('evTitle').value = ev?.title || '';
  $<HTMLInputElement>('evSessionTitle').value = ev?.sessionTitle || '';
  $<HTMLSelectElement>('evCampaign').value = ev?.campaign || 'DevFest';
  $<HTMLSelectElement>('evStatus').value = ev?.status || 'Applied';
  $<HTMLInputElement>('evCity').value = ev?.city || '';
  $<HTMLInputElement>('evCountry').value = ev?.country || currentProfile.homeCountry || '';
  $<HTMLInputElement>('evStartDate').value =
    ev?.startDate || new Date().toISOString().slice(0, 10);
  $<HTMLInputElement>('evEndDate').value =
    ev?.endDate || ev?.startDate || new Date().toISOString().slice(0, 10);
  $<HTMLSelectElement>('evActivityType').value = ev?.activityType || 'Talk';
  $<HTMLSelectElement>('evCfpPlatform').value = ev?.cfpPlatform || 'Sessionize';
  $<HTMLInputElement>('evEventUrl').value = ev?.eventUrl || ev?.cfpUrl || '';
  $('evUrlStatusBanner').textContent = 'Paste a URL to auto-fill event details';

  const bdg =
    ev && [600, 800, 1200, 0].includes(Number(ev.budgetUsd)) ? Number(ev.budgetUsd) : 800;
  $<HTMLSelectElement>('evBudgetUsd').value = String(bdg);
  $<HTMLInputElement>('evReimbursementDate').value = ev?.reimbursementSubmittedDate || '';

  $<HTMLInputElement>('evEventApplied').checked = Boolean(
    ev
      ? (ev.eventApplied ??
          (ev.status === 'Applied' ||
            ev.status === 'Confirmed' ||
            ev.status === 'Completed' ||
            ev.status === 'Declined'))
      : true,
  );
  $<HTMLInputElement>('evEventApproved').checked = Boolean(
    ev?.eventApproved ?? (ev?.status === 'Confirmed' || ev?.status === 'Completed'),
  );
  $<HTMLInputElement>('evWtRequested').checked = Boolean(
    ev?.worktripsRequested ?? (ev && ev.travelApprovalStatus !== 'Not Submitted'),
  );
  $<HTMLInputElement>('evWtApproved').checked = Boolean(
    ev?.worktripsApproved ?? ev?.travelApprovalStatus === 'Approved',
  );
  $<HTMLInputElement>('evReimbursementSubmitted').checked = Boolean(ev?.reimbursementSubmitted);
  $<HTMLInputElement>('evFlightBooked').checked = Boolean(ev?.flightBooked);
  $<HTMLInputElement>('evHotelBooked').checked = Boolean(ev?.hotelBooked);
  $<HTMLInputElement>('evNotes').value = ev?.notes || '';

  renderSessionSuggestions();
  $<HTMLDialogElement>('eventModal').showModal();
  if (!ev) {
    $<HTMLInputElement>('evEventUrl').focus();
  }
}

function openAdvocuModal(ev: GdeEvent): void {
  $<HTMLInputElement>('advEventId').value = ev.id;
  $('advocuModalTitle').textContent = `Post to Advocu: ${ev.title}`;
  $<HTMLInputElement>('advTitle').value = ev.sessionTitle || ev.title;
  $<HTMLInputElement>('advEventUrl').value =
    ev.eventUrl || ev.cfpUrl || 'https://gdg.community.dev';
  $<HTMLInputElement>('advAttendees').value = String(ev.expectedAudience || 200);
  $<HTMLInputElement>('advInPersonAttendees').value = String(
    ev.eventFormat === 'Virtual' ? 0 : ev.expectedAudience || 200,
  );
  $<HTMLTextAreaElement>('advDescription').value =
    ev.notes || `${ev.activityType} delivered at ${ev.title} (${ev.city}, ${ev.country}).`;

  activeAdvocuPhotos = [...(ev.photos ?? [])];
  renderAdvocuPhotos();
  $('advocuModalStatus').hidden = true;
  $<HTMLDialogElement>('advocuModal').showModal();
}

function renderAdvocuPhotos(): void {
  const gallery = $('advPhotoGallery');
  const escapeHtml = ctx.escapeHtml;
  if (activeAdvocuPhotos.length === 0) {
    gallery.innerHTML = `<span class="muted-sm">No event photos uploaded yet.</span>`;
    return;
  }
  gallery.innerHTML = activeAdvocuPhotos
    .map(
      (p) => `
      <div class="photo-item">
        <img src="${p.dataUrl}" alt="${escapeHtml(p.caption)}" />
        <button type="button" class="photo-remove" data-remove-photo="${escapeHtml(p.id)}" title="Remove">&times;</button>
      </div>
    `,
    )
    .join('');
}

export function initTravelPlannerModule(context: TravelPlannerContext): void {
  ctx = context;

  // Travel Planner internal sub-tabs (Itinerary / Discover)
  document.querySelectorAll<HTMLButtonElement>('.tab-btn[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab || 'itinerary';
      document.querySelectorAll('.tab-btn[data-tab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      $('tab-itinerary').hidden = tab !== 'itinerary';
      $('tab-discover').hidden = tab !== 'discover';
    });
  });

  const applyItineraryFilter = (filterVal: string) => {
    activeFilter = filterVal;
    document.querySelectorAll<HTMLButtonElement>('#itineraryFilters .pill').forEach((p) => {
      p.classList.toggle('active', p.dataset.filter === filterVal);
    });
    renderKpisAndItinerary();
  };

  $('itineraryFilters').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-filter]');
    if (!btn) return;
    applyItineraryFilter(btn.dataset.filter || 'all');
  });

  $('kpiGrid').addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-kpi-filter]');
    if (!card) return;
    applyItineraryFilter(card.dataset.kpiFilter || 'all');
  });

  $('btnToggleItineraryView').addEventListener('click', () => {
    itineraryViewMode = itineraryViewMode === 'workflow' ? 'calendar' : 'workflow';
    renderKpisAndItinerary();
  });

  $('itineraryCalendar').addEventListener('click', async (e) => {
    const events = ctx.getEvents();
    const targetEl = e.target as HTMLElement;
    const statusBtn = targetEl.closest<HTMLButtonElement>('button[data-cal-status-id]');
    if (statusBtn) {
      e.stopPropagation();
      const id = statusBtn.dataset.calStatusId || '';
      const ev = events.find((item) => item.id === id);
      if (!ev) return;
      const isConfirmed = Boolean(
        ev.eventApproved ?? (ev.status === 'Confirmed' || ev.status === 'Completed'),
      );
      const updated: GdeEvent = { ...ev };
      if (isConfirmed) {
        updated.eventApproved = false;
        updated.status = 'Applied';
        ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
        renderKpisAndItinerary();
        ctx.showToast(`${ev.title}: Marked as Applied (A)`);
      } else {
        updated.eventApplied = true;
        updated.eventApproved = true;
        updated.status = 'Confirmed';
        ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
        renderKpisAndItinerary();
        ctx.showToast(`${ev.title}: Marked as Confirmed (C)`);
      }
      return;
    }

    const itemEl = targetEl.closest<HTMLElement>('[data-cal-edit-id]');
    if (itemEl) {
      const id = itemEl.dataset.calEditId || '';
      const ev = events.find((item) => item.id === id);
      if (ev) openEventModal(ev);
    }
  });

  $('itineraryList').addEventListener('change', async (e) => {
    const events = ctx.getEvents();
    const target = e.target as HTMLInputElement | HTMLSelectElement;

    if (target instanceof HTMLInputElement && target.dataset.wtId && target.dataset.wtField) {
      const ev = events.find((item) => item.id === target.dataset.wtId);
      if (!ev) return;
      const field = target.dataset.wtField;
      const checked = target.checked;
      const updated: GdeEvent = { ...ev, [field]: checked };

      if (field === 'eventApproved') {
        if (checked) {
          updated.eventApplied = true;
          if (updated.status !== 'Completed') updated.status = 'Confirmed';
        } else if (updated.status === 'Confirmed') {
          updated.status = updated.eventApplied !== false ? 'Applied' : 'Considering';
        }
      } else if (field === 'eventApplied') {
        if (checked && updated.status === 'Considering') {
          updated.status = 'Applied';
        } else if (!checked) {
          updated.eventApproved = false;
          if (updated.status === 'Applied' || updated.status === 'Confirmed') {
            updated.status = 'Considering';
          }
        }
      } else if (field === 'worktripsApproved') {
        if (checked) {
          updated.worktripsRequested = true;
          updated.travelApprovalStatus = 'Approved';
        } else {
          updated.travelApprovalStatus = updated.worktripsRequested
            ? 'Pending Approval'
            : 'Not Submitted';
        }
      } else if (field === 'worktripsRequested') {
        if (!checked) {
          updated.worktripsApproved = false;
          updated.travelApprovalStatus = 'Not Submitted';
        } else if (updated.travelApprovalStatus === 'Not Submitted') {
          updated.travelApprovalStatus = 'Pending Approval';
        }
      } else if (
        field === 'reimbursementSubmitted' &&
        checked &&
        !updated.reimbursementSubmittedDate
      ) {
        updated.reimbursementSubmittedDate = new Date().toISOString().slice(0, 10);
      }

      ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
      renderKpisAndItinerary();
      ctx.showToast(`Saved ${updated.title}`);
      return;
    }

    if (target instanceof HTMLInputElement && target.dataset.eventDateId) {
      const ev = events.find((item) => item.id === target.dataset.eventDateId);
      if (!ev || !target.value) return;
      const newDate = target.value;
      const nextEndDate =
        !ev.endDate || ev.endDate === ev.startDate || ev.endDate < newDate
          ? newDate
          : ev.endDate;
      const updated: GdeEvent = {
        ...ev,
        startDate: newDate,
        endDate: nextEndDate,
      };
      ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
      renderKpisAndItinerary();
      ctx.showToast(`Updated ${ev.title} date to ${newDate}`);
      return;
    }

    if (target instanceof HTMLSelectElement && target.dataset.budgetId) {
      const ev = events.find((item) => item.id === target.dataset.budgetId);
      if (!ev) return;
      const updated: GdeEvent = { ...ev, budgetUsd: Number(target.value) };
      ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
      renderKpisAndItinerary();
      ctx.showToast(
        `Updated ${ev.title} budget to ${updated.budgetUsd === 0 ? 'N/A' : `$${updated.budgetUsd} USD`}`,
      );
      return;
    }

    if (target instanceof HTMLInputElement && target.dataset.reimburseDateId) {
      const ev = events.find((item) => item.id === target.dataset.reimburseDateId);
      if (!ev) return;
      const newDate = target.value;
      const updated: GdeEvent = {
        ...ev,
        reimbursementSubmittedDate: newDate,
        reimbursementSubmitted: Boolean(newDate),
      };
      const wf = evaluateTravelWorkflow(updated);
      ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
      renderKpisAndItinerary();
      ctx.showToast(
        newDate
          ? `${wf.reimbursementMessage} — Click "Reimbursement Received" when paid`
          : `Cleared reimbursement date for ${ev.title}`,
      );
      return;
    }
  });

  $('itineraryList').addEventListener('input', async (e) => {
    const events = ctx.getEvents();
    const target = e.target as HTMLElement;
    if (target instanceof HTMLInputElement && target.dataset.reimburseDateId) {
      const newDate = target.value;
      if (!/^20\d{2}-\d{2}-\d{2}$/.test(newDate)) return;
      const ev = events.find((item) => item.id === target.dataset.reimburseDateId);
      if (!ev || ev.reimbursementSubmittedDate === newDate) return;
      const updated: GdeEvent = {
        ...ev,
        reimbursementSubmittedDate: newDate,
        reimbursementSubmitted: true,
      };
      const wf = evaluateTravelWorkflow(updated);
      ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
      renderKpisAndItinerary();
      ctx.showToast(`${wf.reimbursementMessage} — Click "Reimbursement Received" when paid`);
    }
  });

  $('itineraryList').addEventListener('click', async (e) => {
    const events = ctx.getEvents();
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!btn) return;
    const id = btn.dataset.id || '';
    const action = btn.dataset.action;
    const ev = events.find((item) => item.id === id);
    if (!ev) return;

    if (action === 'set-stage') {
      const clickedStage = Number(btn.dataset.stage || '0');
      const evApplied = Boolean(
        ev.eventApplied ??
          (ev.status === 'Applied' ||
            ev.status === 'Confirmed' ||
            ev.status === 'Completed' ||
            ev.status === 'Declined'),
      );
      const evApproved = Boolean(
        ev.eventApproved ?? (ev.status === 'Confirmed' || ev.status === 'Completed'),
      );
      const wtReq = Boolean(ev.worktripsRequested ?? ev.travelApprovalStatus !== 'Not Submitted');
      const wtApp = Boolean(ev.worktripsApproved ?? ev.travelApprovalStatus === 'Approved');
      const currentStage = wtApp ? 4 : wtReq ? 3 : evApproved ? 2 : evApplied ? 1 : 0;

      const targetStage = clickedStage === currentStage ? Math.max(0, clickedStage - 1) : clickedStage;
      const updated: GdeEvent = { ...ev };

      if (targetStage === 0) {
        updated.eventApplied = false;
        updated.eventApproved = false;
        updated.worktripsRequested = false;
        updated.worktripsApproved = false;
        updated.budgetApproved = false;
        updated.travelApprovalStatus = 'Not Submitted';
        updated.status = 'Considering';
      } else if (targetStage === 1) {
        updated.eventApplied = true;
        updated.eventApproved = false;
        updated.worktripsRequested = false;
        updated.worktripsApproved = false;
        updated.budgetApproved = false;
        updated.travelApprovalStatus = 'Not Submitted';
        updated.status = 'Applied';
      } else if (targetStage === 2) {
        updated.eventApplied = true;
        updated.eventApproved = true;
        updated.worktripsRequested = false;
        updated.worktripsApproved = false;
        updated.budgetApproved = false;
        updated.travelApprovalStatus = 'Not Submitted';
        updated.status = 'Confirmed';
      } else if (targetStage === 3) {
        updated.eventApplied = true;
        updated.eventApproved = true;
        updated.worktripsRequested = true;
        updated.worktripsApproved = false;
        updated.budgetApproved = false;
        updated.travelApprovalStatus = 'Pending';
        updated.status = 'Confirmed';
      } else if (targetStage >= 4) {
        updated.eventApplied = true;
        updated.eventApproved = true;
        updated.worktripsRequested = true;
        updated.worktripsApproved = true;
        updated.budgetApproved = true;
        updated.travelApprovalStatus = 'Approved';
        updated.status = 'Confirmed';
      }

      const stageLabels: Record<number, string> = {
        0: 'Considering (Not Applied)',
        1: 'Step 1: Event Applied',
        2: 'Step 2: Event Approved',
        3: 'Step 3: WorkTrips Requested',
        4: 'Step 4: WorkTrips Approved',
      };

      ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
      renderKpisAndItinerary();
      ctx.showToast(`${ev.title}: ${stageLabels[targetStage] || 'Updated'}`);
      return;
    }

    if (action === 'toggle-field') {
      const field = btn.dataset.field || '';
      const updated: GdeEvent = { ...ev };
      if (field === 'flightBooked') {
        updated.flightBooked = !ev.flightBooked;
      } else if (field === 'hotelBooked') {
        updated.hotelBooked = !ev.hotelBooked;
      } else if (field === 'reimbursementSubmitted') {
        updated.reimbursementSubmitted = !ev.reimbursementSubmitted;
        if (!updated.reimbursementSubmitted) {
          updated.reimbursementSubmittedDate = '';
        }
      }
      ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
      renderKpisAndItinerary();
      if (updated.reimbursementSubmitted && !updated.reimbursementSubmittedDate) {
        window.setTimeout(() => {
          const dateInput = document.querySelector<HTMLInputElement>(
            `input[data-reimburse-date-id="${ev.id}"]`,
          );
          if (dateInput) {
            dateInput.focus();
            try {
              dateInput.showPicker?.();
            } catch {
              // ignore
            }
          }
        }, 50);
      }
      ctx.showToast(`Updated ${ev.title}`);
      return;
    }

    if (action === 'advance-step') {
      const step = btn.dataset.step || '';
      const updated: GdeEvent = { ...ev };
      if (step === 'markCompleted' || step === 'reimbursementReceived') {
        updated.status = 'Completed';
        if (step === 'reimbursementReceived') {
          updated.eventApplied = true;
          updated.eventApproved = true;
          updated.worktripsRequested = true;
          updated.worktripsApproved = true;
          updated.budgetApproved = true;
          updated.travelApprovalStatus = 'Approved';
          updated.reimbursementSubmitted = true;
          if (!updated.reimbursementSubmittedDate) {
            updated.reimbursementSubmittedDate = new Date().toISOString().slice(0, 10);
          }
        }
        ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
        renderKpisAndItinerary();
        ctx.showToast(
          step === 'reimbursementReceived'
            ? `${ev.title}: Reimbursement received — moved to Completed (Archive)`
            : `${ev.title} moved to Completed (Archive)`,
        );
      }
      return;
    }

    if (action === 'undo-step') {
      const updated: GdeEvent = { ...ev };
      if (ev.status === 'Completed') {
        updated.status = 'Confirmed';
        updated.eventApplied = true;
        updated.eventApproved = true;
      }
      ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
      renderKpisAndItinerary();
      ctx.showToast(`Reopened ${ev.title}`);
      return;
    }

    if (action === 'edit') {
      openEventModal(ev);
    } else if (action === 'advocu') {
      openAdvocuModal(ev);
    } else if (action === 'delete') {
      ctx.setEvents(await removeEvent(ctx.getSession(), id));
      renderKpisAndItinerary();
      ctx.showToast(`Removed ${ev.title}`);
    }
  });

  $('btnCloseEventModal').addEventListener('click', () =>
    $<HTMLDialogElement>('eventModal').close(),
  );
  $('btnCancelEventModal').addEventListener('click', () =>
    $<HTMLDialogElement>('eventModal').close(),
  );

  $('btnAutoFillEventUrl').addEventListener('click', () => {
    void handleEventUrlAutoFill();
  });

  $<HTMLInputElement>('evEventUrl').addEventListener('paste', () => {
    window.setTimeout(() => {
      void handleEventUrlAutoFill();
    }, 80);
  });

  $<HTMLInputElement>('evEventUrl').addEventListener('change', () => {
    if (!$<HTMLInputElement>('evTitle').value.trim()) {
      void handleEventUrlAutoFill();
    }
  });

  $('evSessionSuggestions').addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-session-title]');
    if (!chip) return;
    $<HTMLInputElement>('evSessionTitle').value = chip.dataset.sessionTitle || '';
  });

  $<HTMLInputElement>('evCountry').addEventListener('change', () => {
    const country = $<HTMLInputElement>('evCountry').value.trim();
    if (!country) return;
    const currentProfile = ctx.getProfile();
    const homeCountry = currentProfile.homeCountry || '';
    const homeRegion = currentProfile.homeRegion || 'Europe';
    const evRegion = resolveRegion(country, homeRegion);
    const bdg = calculateBudgetUsd(evRegion, homeRegion, country, homeCountry);
    $<HTMLSelectElement>('evBudgetUsd').value = String(bdg);
  });

  $<HTMLInputElement>('evEventApproved').addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    const statusSel = $<HTMLSelectElement>('evStatus');
    if (checked) {
      $<HTMLInputElement>('evEventApplied').checked = true;
      if (statusSel.value !== 'Completed') statusSel.value = 'Confirmed';
    } else if (statusSel.value === 'Confirmed') {
      statusSel.value = $<HTMLInputElement>('evEventApplied').checked ? 'Applied' : 'Considering';
    }
  });

  $<HTMLInputElement>('evEventApplied').addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    const statusSel = $<HTMLSelectElement>('evStatus');
    if (checked && statusSel.value === 'Considering') {
      statusSel.value = 'Applied';
    } else if (!checked) {
      $<HTMLInputElement>('evEventApproved').checked = false;
      if (statusSel.value === 'Applied' || statusSel.value === 'Confirmed') {
        statusSel.value = 'Considering';
      }
    }
  });

  $<HTMLSelectElement>('evStatus').addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    if (val === 'Confirmed' || val === 'Completed') {
      $<HTMLInputElement>('evEventApplied').checked = true;
      $<HTMLInputElement>('evEventApproved').checked = true;
    } else if (val === 'Applied') {
      $<HTMLInputElement>('evEventApplied').checked = true;
      $<HTMLInputElement>('evEventApproved').checked = false;
    } else if (val === 'Considering') {
      $<HTMLInputElement>('evEventApproved').checked = false;
    }
  });

  $('eventForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const events = ctx.getEvents();
    const currentProfile = ctx.getProfile();
    const existingId = $<HTMLInputElement>('evId').value.trim();
    const existing = events.find((item) => item.id === existingId);

    const country =
      $<HTMLInputElement>('evCountry').value.trim() ||
      currentProfile.homeCountry ||
      'Online';
    const region = resolveRegion(country, currentProfile.homeRegion || 'Europe');
    const publicUrl = $<HTMLInputElement>('evEventUrl').value.trim();
    const evApplied = $<HTMLInputElement>('evEventApplied').checked;
    const evApproved = $<HTMLInputElement>('evEventApproved').checked;
    const wtReq = $<HTMLInputElement>('evWtRequested').checked;
    const wtApp = $<HTMLInputElement>('evWtApproved').checked;
    const reimbDate = $<HTMLInputElement>('evReimbursementDate').value;
    const reimbSub = $<HTMLInputElement>('evReimbursementSubmitted').checked || Boolean(reimbDate);
    let status = $<HTMLSelectElement>('evStatus').value as EventStatus;
    if (evApproved && (status === 'Considering' || status === 'Applied')) {
      status = 'Confirmed';
    } else if (!evApproved && evApplied && status === 'Considering') {
      status = 'Applied';
    }

    const startDate =
      $<HTMLInputElement>('evStartDate').value || new Date().toISOString().slice(0, 10);
    const endDate = $<HTMLInputElement>('evEndDate').value || startDate;

    const updated: GdeEvent = {
      id: existingId || `ev-${Date.now()}`,
      title: $<HTMLInputElement>('evTitle').value.trim() || 'GDE Event',
      campaign: $<HTMLSelectElement>('evCampaign').value as EventCampaign,
      city: $<HTMLInputElement>('evCity').value.trim(),
      country,
      region,
      startDate,
      endDate,
      status,
      cfpPlatform: $<HTMLSelectElement>('evCfpPlatform').value as CfpPlatform,
      cfpUrl: existing?.cfpUrl || publicUrl,
      eventUrl: publicUrl,
      sessionTitle: $<HTMLInputElement>('evSessionTitle').value.trim(),
      activityType: $<HTMLSelectElement>('evActivityType').value as ActivityType,
      eventFormat: existing?.eventFormat || 'In-Person',
      expectedAudience: existing?.expectedAudience || 200,
      isGdgOnCampus: false,
      budgetUsd: Number($<HTMLSelectElement>('evBudgetUsd').value),
      eventApplied: evApplied || evApproved,
      eventApproved: evApproved,
      worktripsRequested: wtReq || wtApp,
      worktripsApproved: wtApp,
      worktripsTravelRequested: existing?.worktripsTravelRequested ?? wtReq,
      worktripsTravelApproved: existing?.worktripsTravelApproved ?? wtApp,
      budgetApproved: existing?.budgetApproved ?? wtApp,
      bookingMode: existing?.bookingMode || 'WorkTrips Direct',
      travelApprovalStatus: wtApp ? 'Approved' : wtReq ? 'Pending Approval' : 'Not Submitted',
      flightBooked: $<HTMLInputElement>('evFlightBooked').checked,
      hotelBooked: $<HTMLInputElement>('evHotelBooked').checked,
      worktripsRef: existing?.worktripsRef || '',
      reimbursementSubmitted: reimbSub,
      reimbursementSubmittedDate:
        reimbDate || (reimbSub ? new Date().toISOString().slice(0, 10) : ''),
      reimbursementAmountUsd: existing?.reimbursementAmountUsd || 0,
      advocuSynced: existing?.advocuSynced || false,
      photos: existing?.photos || [],
      notes: $<HTMLInputElement>('evNotes').value.trim(),
      updatedAt: new Date().toISOString(),
    };

    ctx.setEvents(await upsertEvent(ctx.getSession(), updated));
    $<HTMLDialogElement>('eventModal').close();
    renderKpisAndItinerary();
    ctx.showToast(`Saved ${updated.title}`);
  });

  $('btnCloseAdvocuModal').addEventListener('click', () =>
    $<HTMLDialogElement>('advocuModal').close(),
  );

  $<HTMLInputElement>('advPhotoInput').addEventListener('change', async (e) => {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    for (const file of files) {
      const compressed = await compressEventPhoto(file);
      activeAdvocuPhotos.push(compressed);
    }
    renderAdvocuPhotos();
  });

  $('advPhotoGallery').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-remove-photo]');
    if (!btn) return;
    activeAdvocuPhotos = activeAdvocuPhotos.filter((p) => p.id !== btn.dataset.removePhoto);
    renderAdvocuPhotos();
  });

  $('btnAlreadyPostedAdvocu').addEventListener('click', async () => {
    const id = $<HTMLInputElement>('advEventId').value;
    const ev = ctx.getEvents().find((item) => item.id === id);
    if (!ev) return;
    const updatedEv: GdeEvent = {
      ...ev,
      eventUrl: $<HTMLInputElement>('advEventUrl').value.trim() || ev.eventUrl,
      photos: activeAdvocuPhotos,
      advocuSynced: true,
      updatedAt: new Date().toISOString(),
    };
    ctx.setEvents(await upsertEvent(ctx.getSession(), updatedEv));
    $<HTMLDialogElement>('advocuModal').close();
    renderKpisAndItinerary();
    ctx.showToast(`Marked ${ev.title} as already posted in Advocu!`);
  });

  $('advocuForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = $<HTMLInputElement>('advEventId').value;
    const ev = ctx.getEvents().find((item) => item.id === id);
    if (!ev) return;

    const currentProfile = ctx.getProfile();
    const apiKey = (currentProfile.advocuApiKey || '').trim();
    if (!apiKey) {
      $<HTMLDialogElement>('advocuMissingKeyModal').showModal();
      return;
    }

    const updatedEv: GdeEvent = {
      ...ev,
      eventUrl: $<HTMLInputElement>('advEventUrl').value.trim(),
      photos: activeAdvocuPhotos,
    };

    const res = await submitToAdvocu(updatedEv, currentProfile, {
      title: $<HTMLInputElement>('advTitle').value.trim(),
      activityUrl: updatedEv.eventUrl,
      attendees: Number($<HTMLInputElement>('advAttendees').value),
      inPersonAttendees: Number($<HTMLInputElement>('advInPersonAttendees').value),
      description: $<HTMLTextAreaElement>('advDescription').value.trim(),
    });

    if (res.ok) updatedEv.advocuSynced = true;
    ctx.setEvents(await upsertEvent(ctx.getSession(), updatedEv));
    renderKpisAndItinerary();

    const statusEl = $('advocuModalStatus');
    statusEl.hidden = false;
    statusEl.className = res.ok ? 'sync-banner' : 'sync-banner warn';
    statusEl.textContent = res.message;
  });

  $('btnCloseAdvocuMissingKeyModal').addEventListener('click', () => {
    $<HTMLDialogElement>('advocuMissingKeyModal').close();
  });
  $('btnDismissAdvocuMissingKey').addEventListener('click', () => {
    $<HTMLDialogElement>('advocuMissingKeyModal').close();
  });
  $('btnGoToConfigForAdvocuKey').addEventListener('click', () => {
    $<HTMLDialogElement>('advocuMissingKeyModal').close();
    $<HTMLDialogElement>('advocuModal').close();
    ctx.switchToConfigForAdvocuKey();
  });

  $('discoverSearch').addEventListener('input', renderDiscover);
  $('discoverRegion').addEventListener('change', renderDiscover);

  $('discoverSourceFilters').addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-discover-source]');
    if (!btn) return;
    activeDiscoverSource = btn.dataset.discoverSource || 'ALL';
    document
      .querySelectorAll('#discoverSourceFilters .pill')
      .forEach((p) => p.classList.toggle('active', p === btn));
    renderDiscover();
  });

  $('discoverList').addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-discover-id]');
    if (!btn) return;
    const d = discoveredEvents.find((item) => item.externalId === btn.dataset.discoverId);
    if (!d) return;
    const currentProfile = ctx.getProfile();
    const fallbackRegion = currentProfile.homeRegion || 'Europe';
    const evRegion = d.region || resolveRegion(d.country, fallbackRegion, d.countryCode);
    const budgetUsd = calculateBudgetUsd(
      evRegion,
      fallbackRegion,
      d.country,
      currentProfile.homeCountry || '',
    );
    const todayIso = new Date().toISOString().slice(0, 10);
    const startDate = d.startDate || todayIso;
    const endDate = d.endDate || startDate;

    const added: GdeEvent = {
      id: `disc-${Date.now()}`,
      title: d.title,
      campaign: d.campaign,
      city: d.city,
      country: d.country,
      region: evRegion,
      startDate,
      endDate,
      status: 'Considering',
      cfpPlatform: /sessionize\.com/i.test(d.cfpUrl || d.url)
        ? 'Sessionize'
        : /docs\.google\.com\/forms|forms\.gle/i.test(d.cfpUrl || d.url)
          ? 'Google Forms'
          : d.source === 'Live GDG' || d.source === 'EMEA GDG Chapter'
            ? 'Bevy / GDG'
            : 'Other',
      cfpUrl: d.cfpUrl || d.url,
      eventUrl: d.url,
      sessionTitle: '',
      activityType: 'Talk',
      eventFormat: d.eventFormat || 'In-Person',
      expectedAudience: d.expectedAudience || 250,
      isGdgOnCampus: Boolean(d.isGdgOnCampus),
      budgetUsd,
      eventApplied: false,
      eventApproved: false,
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
      notes: `Imported from ${d.chapterTitle}${d.techFocus ? ` (${d.techFocus})` : ''}`,
      updatedAt: new Date().toISOString(),
    };
    ctx.setEvents(await upsertEvent(ctx.getSession(), added));
    renderKpisAndItinerary();
    ctx.showToast(`Added ${d.title} to your itinerary!`);
  });

  $('btnOpenSmartImport').addEventListener('click', () =>
    $<HTMLDialogElement>('smartImportModal').showModal(),
  );
  $('btnCloseSmartImport').addEventListener('click', () =>
    $<HTMLDialogElement>('smartImportModal').close(),
  );
  $('btnCancelSmartImport').addEventListener('click', () =>
    $<HTMLDialogElement>('smartImportModal').close(),
  );

  $('smartImportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentProfile = ctx.getProfile();
    const raw = $<HTMLTextAreaElement>('smartImportText').value;
    const advocuRows = parseAdvocuMyEventsTable(raw, currentProfile);
    if (advocuRows.length > 0) {
      $<HTMLDialogElement>('smartImportModal').close();
      $<HTMLTextAreaElement>('smartImportText').value = '';
      ctx.setEvents(
        await upsertEventsBatch(ctx.getSession(), advocuRows, { preserveExisting: false }),
      );
      renderKpisAndItinerary();
      ctx.showToast(`Imported ${advocuRows.length} event(s) from Advocu My Events!`);
      return;
    }

    const parsed = parseSmartImport(raw, currentProfile);
    $<HTMLDialogElement>('smartImportModal').close();
    $<HTMLTextAreaElement>('smartImportText').value = '';
    openEventModal({
      id: `smart-${Date.now()}`,
      title: parsed.title || 'Imported Event',
      campaign: parsed.campaign || 'DevFest',
      city: '',
      country: parsed.country || currentProfile.homeCountry || '',
      region: parsed.region || currentProfile.homeRegion || 'Europe',
      startDate: parsed.startDate || new Date().toISOString().slice(0, 10),
      endDate: parsed.endDate || new Date().toISOString().slice(0, 10),
      status: 'Applied',
      cfpPlatform: parsed.cfpPlatform || 'Sessionize',
      cfpUrl: parsed.cfpUrl || '',
      eventUrl: parsed.eventUrl || '',
      sessionTitle: '',
      activityType: 'Talk',
      eventFormat: 'In-Person',
      expectedAudience: 250,
      isGdgOnCampus: false,
      budgetUsd: parsed.budgetUsd || 800,
      eventApplied: true,
      eventApproved: false,
      worktripsRequested: parsed.travelApprovalStatus !== undefined,
      worktripsApproved: parsed.travelApprovalStatus === 'Approved',
      worktripsTravelRequested: Boolean(parsed.flightBooked),
      worktripsTravelApproved: Boolean(parsed.hotelBooked),
      budgetApproved: parsed.travelApprovalStatus === 'Approved',
      bookingMode: 'WorkTrips Direct',
      travelApprovalStatus: parsed.travelApprovalStatus || 'Not Submitted',
      flightBooked: Boolean(parsed.flightBooked),
      hotelBooked: Boolean(parsed.hotelBooked),
      worktripsRef: parsed.worktripsRef || '',
      reimbursementSubmitted: false,
      reimbursementSubmittedDate: '',
      reimbursementAmountUsd: 0,
      advocuSynced: false,
      photos: [],
      notes: '',
      updatedAt: new Date().toISOString(),
    });
  });

  void fetchLiveGdgEvents().then((live) => {
    discoveredEvents = live;
    if (!$('dashboardView').hidden) renderDiscover();
  });
}
