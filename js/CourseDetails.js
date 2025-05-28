import {
  getAvailableExams,
  getExamById,
  registerExam,
  addNotification,
  dispatchAppUpdate
} from './examService.js';

// Derive base path for icons dynamically (ensures correct loading regardless of HTML location)
const scriptEl = document.currentScript;
const basePath = scriptEl
  ? scriptEl.src.replace(/\/js\/CourseDetails(?:\.js)?(?:\?.*)?$/, '/')
  : '/';
const iconPath = name => `${basePath}icons/${name}`;

// Supplemental course metadata not stored in examService
const courseMeta = {
  '344.011': { semester: '2024S', hours: 2.0, format: 'On-Site' },
  '353.068': { semester: '2024S', hours: 2.0, format: 'On-Site' },
  '510.517': { semester: '2024S', hours: 2.0, format: 'On-Site' },
  '353.067': { semester: '2024S', hours: 2.0, format: 'On-Site' },
  // ... add other courses here as needed
};

/** Formats a Date to "dd.mm.yyyy" */
function formatDate(d) {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
/** Formats a Date to "HH:mm" */
function formatTime(d) {
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('course');
  if (!courseId) {
    alert('No course specified.');
    window.location.href = 'ExamRegistration.html';
    return;
  }

  const titleEl = document.querySelector('.course-title');
  const tbody = document.querySelector('.course-info-table tbody');
  const examList = document.querySelector('.exam-list');

  // Fetch course metadata
  const meta = getExamById(courseId);
  if (!meta) {
    alert('Course not found.');
    window.location.href = 'ExamRegistration.html';
    return;
  }

  // Populate title
  titleEl.textContent = meta.title;
  
  // 1) Update the hidden breadcrumb text
  const bcCourse = document.getElementById('breadcrumb-course');
  if (bcCourse) {
    bcCourse.textContent = meta.title;
  }

  // 2) Update the browser <title> to include the actual course name
  document.title = `${meta.title} – Course Details – Accessible Examination Website`;

  // Populate course info table
  tbody.innerHTML = '';
  const extra = courseMeta[courseId] || {};
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${meta.id} ${extra.semester ? `(${extra.semester})` : ''}</td>
    <td>${meta.type}</td>
    <td>${meta.ects.toFixed(2)}</td>
    <td>${(extra.hours || 0).toFixed(1)}</td>
    <td>${extra.format || ''}</td>
    <td>${meta.lecturer}</td>
  `;
  tbody.appendChild(tr);

  // Populate exam sessions
  const sessions = getAvailableExams()
    .filter(e => e.id === courseId)
    .map(e => ({
      ...e,
      examStart: e.examStart instanceof Date ? e.examStart : new Date(e.examStart),
      examEnd: e.examEnd instanceof Date ? e.examEnd : new Date(e.examEnd),
      registrationStart: e.registrationStart
        ? new Date(e.registrationStart)
        : null,
      registrationDeadline:
        e.registrationDeadline instanceof Date
          ? e.registrationDeadline
          : new Date(e.registrationDeadline),
      deregistrationDeadline:
        e.deregistrationDeadline instanceof Date
          ? e.deregistrationDeadline
          : new Date(e.deregistrationDeadline)
    }));
    const srIntro = document.getElementById('screen-reader-intro');
    if (srIntro) {
      const sessionCount = sessions.length;
      srIntro.textContent = `Course details loaded: ${meta.title}. ${sessionCount} exam session${sessionCount === 1 ? '' : 's'} available.`;
    }


  examList.innerHTML = '';
  if (sessions.length === 0) {
    examList.innerHTML = '<p>No available exam sessions.</p>';
  } else {
    sessions.forEach((e, i) => {
      const now = new Date('2024-11-01'); // Set today's date to November 1, 2024
      let status = 'open';
      let disabled = false;

      if (e.registrationStart && e.registrationStart > now) {
        // Registration has not started yet
        status = 'upcoming';
        disabled = true;
      } else if (e.deregistrationDeadline && e.deregistrationDeadline < now) {
        // Deregistration deadline has passed
        status = 'closed';
        disabled = true;
      } else if (e.registrationDeadline < now) {
        // Registration deadline has passed but deregistration is still open
        status = 'upcoming';
        disabled = true;
      }

      const art = document.createElement('article');
      art.className = `exam-card status-${status}`;
      art.setAttribute('aria-labelledby', `exam-date-${i}`);
      art.innerHTML = `
        <ul class="exam-details">
          <li>
            <img src="${iconPath('exam-date.png')}" alt="" aria-hidden="true" />
            <strong>Exam Date:</strong>
            <span id="exam-date-${i}">${formatDate(e.examStart)}</span>
          </li>
          <li>
            <img src="${iconPath('reg-period.png')}" alt="" aria-hidden="true" />
            <strong>Registration Period:</strong>
            ${e.registrationStart
              ? `${formatDate(e.registrationStart)} ${formatTime(e.registrationStart)} to `
              : '- to '}${formatDate(e.registrationDeadline)} ${formatTime(e.registrationDeadline)}
          </li>
          <li>
            <img src="${iconPath('exam-time.png')}" alt="" aria-hidden="true" />
            <strong>Exam Time:</strong>
            ${formatTime(e.examStart)} – ${formatTime(e.examEnd)}
          </li>
          <li>
            <img src="${iconPath('exam-location.png')}" alt="" aria-hidden="true" />
            <strong>Location:</strong>
            ${e.location || 'To be Notified'}
          </li>
          <li>
            <span class="status-badge ${status}" role="text">
              <span class="sr-only">Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</span>
              <strong aria-hidden="true">Status:</strong>
              <span aria-hidden="true">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </span>
            <button
              class="btn view-register-btn"
              data-special="true"
              data-id="${e.id}"
              data-start="${e.examStart.toISOString()}"
              tabindex="0"
              ${disabled ? 'aria-disabled="true"' : ''}
              aria-label="Register for ${meta.title} on ${formatDate(e.examStart)} from ${formatTime(e.examStart)} to ${formatTime(e.examEnd)}${e.location ? ` in ${e.location}` : ', location to be notified'}${disabled ? ' (registration closed)' : ''}"
            >
              Register
            </button>
          </li>
        </ul>
      `;
      examList.appendChild(art);
    });
  }

  // ——————— SEARCH FILTER FOR “Not Registered” SESSIONS ———————
  const searchInput = document.getElementById('searchCourseDetails');
  const clearBtn = document.getElementById('clearSearchBtn');
  if (clearBtn && searchInput) {
    const toggleClearBtn = () => {
      clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
    };
    toggleClearBtn();
    searchInput.addEventListener('input', toggleClearBtn);
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
      toggleClearBtn();
    });
  }
  const resultCount = document.getElementById('course-details-result-count');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const term = searchInput.value.trim().toLowerCase();
      // Only the articles under examList (Current examinations — Not Registered)
      const cards = Array.from(examList.querySelectorAll('article.exam-card'));
      let visibleCount = 0;

      cards.forEach(card => {
        const isMatch = card.textContent.toLowerCase().includes(term);
        card.hidden = !isMatch;
        if (isMatch) visibleCount++;
      });

      if (resultCount) {
        resultCount.textContent =
          term === ''
            ? ''
            : `${visibleCount} session${visibleCount === 1 ? '' : 's'} found.`;
      }
    });
  }

  // Handle registrations
  examList.addEventListener('click', evt => {
    const btn = evt.target.closest('.view-register-btn');
    if (!btn) return;
    const id = btn.dataset.id;
    const start = new Date(btn.dataset.start);
    const session = sessions.find(
      e => e.id === id && e.examStart.getTime() === start.getTime()
    );

    if (!btn || btn.getAttribute('aria-disabled') === 'true') {
      evt.preventDefault();
      return;
    }

    if (session && registerExam(id, session.examStart)) {
      // 1) update all dependent views
      dispatchAppUpdate();
      // 2) reflect in this button
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = 'Registered';
      btn.setAttribute(
        'aria-label',
        `Registered for ${meta.title} on ${formatDate(session.examStart)}.`
      );
      // — remove btn.setAttribute('aria-live', …) and immediate back()

      // 3) announce via the hidden alert container:
      const confirmEl = document.getElementById('reg-confirm');
      if (confirmEl) {
        confirmEl.textContent =
          `Registered for ${meta.title} on ${formatDate(session.examStart)}.`;
      }
      // 4) give screen-readers a moment, then go back
      setTimeout(() => window.history.back(), 500);
    }
  });

});