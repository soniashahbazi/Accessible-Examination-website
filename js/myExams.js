import { getRegisteredExams, deregisterExam, dispatchAppUpdate } from './examService.js';

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}.${month}.${year}`;
}

const currentDate = new Date('2024-11-01');
let currentSearchTerm = '';

function parseCustomDateTime(text) {
  const dateTimeRegex = /^\d{2}\.\d{2}\.\d{4}( at \d{2}:\d{2})?$/;
  text = text.trim();
  if (!dateTimeRegex.test(text)) {
    console.error(`Invalid date format: ${text}`);
    return NaN;
  }
  const [datePart, timePart] = text.split(' at ');
  const [day, month, year] = datePart.split('.');
  const [hh = '0', mm = '0'] = (timePart || '').split(':');
  return new Date(+year, +month - 1, +day, +hh, +mm).getTime();
}

function initColumnSorting() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const table = btn.closest('table');
      const tbody = table.tBodies[0];
      const rows = Array.from(tbody.rows);
      const idx = +btn.dataset.key - 1;
      const type = btn.dataset.type;
      const headerCell = btn.closest('th');
      const state = headerCell.getAttribute('aria-sort') || 'none';
      const asc = state === 'none' || state === 'descending';

      table.querySelectorAll('th[aria-sort]').forEach(th =>
        th.setAttribute('aria-sort', 'none')
      );
      headerCell.setAttribute('aria-sort', asc ? 'ascending' : 'descending');

      rows.sort((a, b) => {
        const aText = a.cells[idx].textContent.trim();
        const bText = b.cells[idx].textContent.trim();
        let cmp;
        if (type === 'number') {
          cmp = parseFloat(aText) - parseFloat(bText);
        } else if (type === 'date') {
          const aDate = parseCustomDateTime(aText);
          const bDate = parseCustomDateTime(bText);
          cmp = (isNaN(aDate) ? 0 : aDate) - (isNaN(bDate) ? 0 : bDate);
        } else {
          cmp = aText.localeCompare(bText, undefined, {
            numeric: true,
            sensitivity: 'base'
          });
        }
        return asc ? cmp : -cmp;
      });

      rows.forEach(r => tbody.appendChild(r));
      const statusEl = document.getElementById('my-exams-sort-status');
      if (statusEl) {
        statusEl.textContent = `Sorted by ${btn.textContent.trim()} ${asc ? 'ascending' : 'descending'}.`;
      }
    });
  });
}

function renderMyExams(exams = null) {
  const tbody = document.querySelector('.my-exams-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const allExams = exams || getRegisteredExams();
  const data = currentSearchTerm
    ? allExams.filter(e => {
        const examStartStr = `${formatDate(e.examStart)} ${formatTime(e.examStart)}`;
        const deadlineStr = `${formatDate(e.deregistrationDeadline)} ${formatTime(e.deregistrationDeadline)}`;
        const statusStr = e.status.toLowerCase();
        const idStr = e.id.toLowerCase();

        return (
          e.title.toLowerCase().includes(currentSearchTerm) ||
          e.location?.toLowerCase().includes(currentSearchTerm) ||
          examStartStr.includes(currentSearchTerm) ||
          deadlineStr.includes(currentSearchTerm) ||
          statusStr.includes(currentSearchTerm) ||
          idStr.includes(currentSearchTerm)
        );
      })
    : allExams;


  const feedbackEl = document.getElementById('search-feedback');
  if (feedbackEl) {
    if (currentSearchTerm.length > 0) {
      feedbackEl.textContent = data.length === 0
        ? 'No exams found for the current search.'
        : `${data.length} exams found.`;
    } else {
      feedbackEl.textContent = ''; // Prevents SR announcement on initial load
    }
  }

  if (data.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 8;
    cell.textContent = 'No exams found.';
    cell.style.textAlign = 'center';
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  data.sort((a, b) => a.title.localeCompare(b.title));
  data.forEach(e => {
    const start = formatTime(e.examStart);
    const end = formatTime(e.examEnd);
    const deadline = formatDate(e.deregistrationDeadline) + ' at ' + formatTime(e.deregistrationDeadline);
    const statusLabel = e.status.charAt(0).toUpperCase() + e.status.slice(1);
    const isDeregisterable = currentDate < e.deregistrationDeadline;

    const tr = document.createElement('tr');
    tr.setAttribute('tabindex', '-1');

    const examTitle = e.title;
    const examStartStr = `${formatDate(e.examStart)} at ${formatTime(e.examStart)}`;
    const location = e.location || 'To be notified';
    const descId = `exam-desc-${e.id}`;

    const description = `${examTitle}, on ${examStartStr}, in ${location}`;
    const shouldDescribe = currentSearchTerm.length > 0;

    const descHTML = shouldDescribe
      ? `<span id="${descId}" class="sr-only">${description}</span>`
      : '';

    const buttonHTML = `
      <button
        class="btn deregister-btn"
        data-id="${e.uniqueKey || e.id}"
        ${isDeregisterable ? '' : 'disabled aria-disabled="true"'}
        aria-label="Deregister exam ${e.title}"
        ${shouldDescribe ? `aria-describedby="${descId}"` : ''}
      >
        Deregister
      </button>
    `;

    tr.innerHTML = `
      <td>${e.id}</td>
      <td><span class="exam-name">${e.title}</span></td>
      <td>${formatDate(e.examStart)}</td>
      <td>${formatTime(e.examStart)} to ${formatTime(e.examEnd)}</td>
      <td>${location}</td>
      <td>
        <span class="status-badge ${e.status}" aria-label="Exam status: ${e.status.charAt(0).toUpperCase() + e.status.slice(1)}">
          <img src="icons/${e.status}-status.png" alt="" aria-hidden="true" />
          ${e.status}
        </span>
      </td>
      <td>${formatDate(e.deregistrationDeadline)} at ${formatTime(e.deregistrationDeadline)}</td>
      <td>${descHTML}${buttonHTML}</td>
    `;

    tbody.appendChild(tr);

    tbody.appendChild(tr);
  });
  if (currentSearchTerm.length > 0) {
    setTimeout(() => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) {
        return; // User is still typing — don't shift focus
      }
      const firstRow = tbody.querySelector('tr');
      if (firstRow) firstRow.focus();
    }, 100); // Let input settle
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('.my-exams-table');
  if (!table) return;

  renderMyExams();
  initColumnSorting();

  const searchInput = document.getElementById('searchExams');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearchTerm = searchInput.value.trim().toLowerCase();
      if (searchInput.value.trim()) {
        clearSearchBtn.style.display = 'flex';
        clearSearchBtn.setAttribute('aria-hidden', 'false');
      } else {
        clearSearchBtn.style.display = 'none';
        clearSearchBtn.setAttribute('aria-hidden', 'true');
      }
      renderMyExams();
    }); 
  }

  window.addEventListener('app:update', () => {
    renderMyExams();
  });

  window.addEventListener('pageshow', () => {
    renderMyExams();
  });

  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn && searchInput) {
    clearSearchBtn.style.display = 'none'; //Hide by default
    clearSearchBtn.setAttribute('aria-hidden', 'true');

    searchInput.addEventListener('input', () => {
      currentSearchTerm = searchInput.value.trim().toLowerCase();

      const visible = currentSearchTerm.length > 0;
      clearSearchBtn.style.display = visible ? 'flex' : 'none';
      clearSearchBtn.setAttribute('aria-hidden', !visible);

      renderMyExams();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchTerm = '';
      clearSearchBtn.style.display = 'none';
      clearSearchBtn.setAttribute('aria-hidden', 'true');
      renderMyExams();
    });
  }

});
