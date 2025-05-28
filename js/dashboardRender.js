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

  // count whole days difference, ignoring time‐of‐day
  const diffDays = Math.floor(ms / DAY_MS);

  if (diffDays <= 3) {
    return { label: 'Urgent',   class: 'urgent',   icon: 'urgent.png' };
  } else if (diffDays <= 7) {
    return { label: 'Upcoming', class: 'upcoming', icon: 'upcoming.png' };
  } else {
    return null;
  }
}

export function renderUpcomingRegistrations() {
  const tbody = document.getElementById('registration-deadlines-tbody');
  if (!tbody) {
    console.error('Cannot find #registration-deadlines-tbody');
    return;
  }
  tbody.innerHTML = '';

  // Only include exams whose registration window is currently open
  const all = getAvailableExams({ onlyActive: true });
  const map = new Map();
  for (const e of all) {
    if (
      !map.has(e.id) ||
      new Date(map.get(e.id).registrationDeadline) >
        new Date(e.registrationDeadline)
    ) {
      map.set(e.id, e);
    }
  }

  Array.from(map.values())
    .sort(
      (a, b) =>
        new Date(a.registrationDeadline) - new Date(b.registrationDeadline)
    )
    .forEach((e) => {
      const deadline = e.registrationDeadline
        ? new Date(e.registrationDeadline)
        : null;
      const deadlineStr = formatDateTime(deadline);
      const { label, class: cls, icon } = getDeadlineLabel(deadline) || {};

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <span class="exam-name">${e.title}</span>
          ${
            label
              ? `<img src="icons/${icon}" class="exam-icon ${cls}-icon" alt="${label}">
                 <span class="exam-${cls}" aria-hidden="true">${label}</span>`
              : ''
          }
        </td>
        <td>${deadlineStr}</td>
        <td>
          <a
            href="CourseDetails.html?course=${e.id}"
            class="btn register-btn"
            aria-label="Register for ${e.title}"
          >Register Now</a>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

export function renderUpcomingDeregistrations() {
  const tbody = document.getElementById('deregistration-deadlines-tbody');
  if (!tbody) {
    console.error('Cannot find #deregistration-deadlines-tbody');
    return;
  }
  tbody.innerHTML = '';

  getRegisteredExams()
    .filter(e => e.deregistrationDeadline && new Date(e.deregistrationDeadline) >= TODAY)
    .sort(
      (a, b) =>
        new Date(a.deregistrationDeadline) -
        new Date(b.deregistrationDeadline)
    )
    .forEach((e) => {
      const deadline = e.deregistrationDeadline
        ? new Date(e.deregistrationDeadline)
        : null;
      const deadlineStr = formatDateTime(deadline);
      const { label, class: cls, icon } = getDeadlineLabel(deadline) || {};

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <span class="exam-name">${e.title}</span>
          ${
            label
              ? `<img src="icons/${icon}" class="exam-icon ${cls}-icon" alt="${label}">
                 <span class="exam-${cls}" aria-hidden="true">${label}</span>`
              : ''
          }
        </td>
        <td>${deadlineStr}</td>
        <td>
          <button
            class="btn deregister-btn"
            data-id="${e.id}"
            aria-label="Deregister from ${e.title}"
          >Deregister</button>
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
  const countEl = document.getElementById('examCount');
  if (countEl) countEl.textContent = allRegs.length;
  // Update singular/plural label for registered exams
  const examLabelEl = document.getElementById('examLabel');
  if (examLabelEl) {
    examLabelEl.textContent = allRegs.length === 1 ? 'exam' : 'exams';
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  const upcomingThisWeek = allRegs.filter(e => {
    const start = new Date(e.examStart);
    return start >= TODAY && start <= new Date(TODAY.getTime() + 7 * DAY_MS);
  });
  const upcomingCountEl = document.getElementById('upcomingCount');
  if (upcomingCountEl) upcomingCountEl.textContent = upcomingThisWeek.length;
  // Update singular/plural label for upcoming exams
  const upcomingLabelEl = document.getElementById('upcomingLabel');
  if (upcomingLabelEl) {
    upcomingLabelEl.textContent = upcomingThisWeek.length === 1 ? 'exam' : 'exams';
  }
}

// Initialize and subscribe to updates
document.addEventListener('DOMContentLoaded', () => {
  updateDashboard();
  window.addEventListener('app:update', updateDashboard);
});
