// 📁 js/dashboardRender.js
import { getAvailableExams, getRegisteredExams } from './examService.js';

const TODAY = new Date('2024-11-01T00:00:00'); // freeze “today” for demo

/**
 * Safely format a Date or date‐string into “DD MMM YYYY at HH:MM”
 * Returns an empty string if no date is provided.
 */
function formatDateTime(date) {
  if (!date) return '';
  const dt = date instanceof Date ? date : new Date(date);
  return dt
    .toLocaleString('en-GB', {
      day:    '2-digit',
      month:  'short',
      year:   'numeric',
      hour:   '2-digit',
      minute: '2-digit',
      hour12: false
    })
    .replace(',', ' at');
}

/**
 * Returns a label/icon for a deadline based on how many days out it is:
 *  • diff <  0            → Expired
 *  • diff ≤ 3 days        → Urgent
 *  • diff > 3 && ≤ 7 days → Upcoming
 *  • diff > 7 days        → no label
 */
function getDeadlineLabel(date) {
  if (!date) return null;

  const dt     = date instanceof Date ? date : new Date(date);
  const ms     = dt - TODAY;
  const DAY_MS = 24 * 60 * 60 * 1000;

  if (ms < 0) {
    return { label: 'Expired',  class: 'expired',  icon: 'expired.svg' };
  }

  const diffDays = Math.floor(ms / DAY_MS);
  if (diffDays <= 3) {
    return { label: 'Urgent',   class: 'urgent',   icon: 'urgent.png' };
  } else if (diffDays <= 7) {
    return { label: 'Upcoming', class: 'upcoming', icon: 'upcoming.png' };
  }

  return null;
}

export function renderUpcomingRegistrations() {
  const tbody = document.getElementById('registration-deadlines-tbody');
  tbody.innerHTML = '';

  const all = getAvailableExams({ onlyActive: true });
  const map = new Map();
  for (const e of all) {
    if (!map.has(e.id) || new Date(map.get(e.id).registrationDeadline) > new Date(e.registrationDeadline)) {
      map.set(e.id, e);
    }
  }

  const exams = Array.from(map.values())
    .sort((a, b) => new Date(a.registrationDeadline) - new Date(b.registrationDeadline));

  const skipReg = document.querySelector('.skip-to-results[href="#registration-results"]');
  if (exams.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="3">No upcoming registration deadlines found.</td>`;
    tbody.appendChild(tr);
    if (skipReg) skipReg.style.display = 'none';
    return;
  } else {
    if (skipReg) skipReg.style.display = '';
  }

  exams.forEach((e) => {
    const deadline = new Date(e.registrationDeadline);
    const deadlineStr = formatDateTime(deadline);
    const { label, class: cls, icon } = getDeadlineLabel(deadline) || {};

    const tr = document.createElement('tr');
    tr.setAttribute('tabindex', '-1');
    tr.setAttribute('role', 'row');
    tr.innerHTML = `
      <td>
        <span class="exam-name">${e.title}</span>
        ${label ? `<img src="icons/${icon}" class="exam-icon ${cls}-icon" alt="${label}"><span class="exam-${cls}" aria-hidden="true">${label}</span>` : ''}
      </td>
      <td>${deadlineStr}</td>
      <td>
        <a id="register-${e.id}" href="CourseDetails.html?course=${e.id}" class="btn register-btn" aria-labelledby="course-${e.id} date-${e.id} register-${e.id}">
          Register
        </a>
        <span id="course-${e.id}" class="sr-only">${e.title}</span>
        <span id="date-${e.id}" class="sr-only">${deadlineStr}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

export function renderUpcomingDeregistrations() {
  const tbody = document.getElementById('deregistration-deadlines-tbody');
  tbody.innerHTML = '';

  const exams = getRegisteredExams()
    .filter(e => e.deregistrationDeadline && new Date(e.deregistrationDeadline) >= TODAY)
    .sort((a, b) => new Date(a.deregistrationDeadline) - new Date(b.deregistrationDeadline));

  const skipDereg = document.querySelector('.skip-to-results[href="#deregistration-results"]');
  if (exams.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="3">No upcoming deregistration deadlines found.</td>`;
    tbody.appendChild(tr);
    if (skipDereg) skipDereg.style.display = 'none';
    return;
  } else {
    if (skipDereg) skipDereg.style.display = '';
  }

  exams.forEach((e) => {
    const deadline = new Date(e.deregistrationDeadline);
    const deadlineStr = formatDateTime(deadline);
    const { label, class: cls, icon } = getDeadlineLabel(deadline) || {};

    const tr = document.createElement('tr');
    tr.setAttribute('tabindex', '-1');
    tr.setAttribute('role', 'row');
    tr.innerHTML = `
      <td>
        <span class="exam-name">${e.title}</span>
        ${label ? `<img src="icons/${icon}" class="exam-icon ${cls}-icon" alt="${label}"><span class="exam-${cls}" aria-hidden="true">${label}</span>` : ''}
      </td>
      <td>${deadlineStr}</td>
      <td>
        <button id="dereg-btn-${e.id}" class="btn deregister-btn" data-id="${e.id}" aria-labelledby="dereg-course-${e.id} dereg-date-${e.id} dereg-btn-${e.id}">
          Deregister
        </button>
        <span id="dereg-course-${e.id}" class="sr-only">${e.title}</span>
        <span id="dereg-date-${e.id}" class="sr-only">${deadlineStr}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Updates counts and rerenders on demand
 */
function updateDashboard() {
  renderUpcomingRegistrations();
  renderUpcomingDeregistrations();

  const allRegs = getRegisteredExams();
  const total = allRegs.length;
  const DAY_MS = 24 * 60 * 60 * 1000;
  const upcomingThisWeek = allRegs.filter(e => {
    const start = new Date(e.examStart);
    return start >= TODAY && start <= new Date(TODAY.getTime() + 7 * DAY_MS);
  }).length;

  // Atomic update of the live region to trigger a single announcement
  const overview = document.getElementById('overview');
  if (overview) {
    overview.textContent =
      `You have ${total} registered ${total === 1 ? 'exam' : 'exams'} and ` +
      `${upcomingThisWeek} upcoming ${upcomingThisWeek === 1 ? 'exam' : 'exams'}.`;
  }
}

// Initialize and subscribe to updates
document.addEventListener('DOMContentLoaded', () => {
  updateDashboard();
  window.addEventListener('app:update', updateDashboard);
});
