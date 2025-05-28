import { getAvailableExams, registerExam, dispatchAppUpdate } from './examService.js';

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
    btn.setAttribute('aria-sort', 'none');
    btn.addEventListener('click', () => {
      const table = btn.closest('table');
      const tbody = table.tBodies[0];
      const rows = Array.from(tbody.rows);
      const idx = +btn.dataset.key - 1;
      const type = btn.dataset.type;
      const th = btn.closest('th');
      const prev = th.getAttribute('aria-sort') || 'none';
      const asc = prev === 'none' || prev === 'descending';

      table.querySelectorAll('th[aria-sort]').forEach(h =>
        h.setAttribute('aria-sort', 'none')
      );
      th.setAttribute('aria-sort', asc ? 'ascending' : 'descending');

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
      const statusEl = document.getElementById('reg-sort-status');
      if (statusEl) {
        statusEl.textContent = `Sorted by ${btn.textContent.trim()} ${asc ? 'ascending' : 'descending'}.`;
      }
    });
  });
}

function filterExams(exams, keyword) {
  keyword = keyword.trim().toLowerCase();
  return exams.filter(e => {
    const deadline = new Date(e.registrationDeadline);
    const formattedDeadline = deadline.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    return (
      e.id.toLowerCase().includes(keyword) ||
      e.title.toLowerCase().includes(keyword) ||
      e.type.toLowerCase().includes(keyword) ||
      e.ects.toFixed(2).includes(keyword) ||
      e.lecturer.toLowerCase().includes(keyword) ||
      formattedDeadline.toLowerCase().includes(keyword) ||
      'not registered'.includes(keyword) // fixed status 
    );
  });
}


function renderExamRegistration(exams = null) {
  const tbody = document.querySelector('.exam-registration-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const allExams = exams || getAvailableExams({ onlyActive: true });
  const data = currentSearchTerm ? filterExams(allExams, currentSearchTerm) : allExams;

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

  data.forEach(e => {
    const deadline = new Date(e.registrationDeadline);
    const formattedDate = deadline.toLocaleDateString('en-GB').replace(/\//g, '.');
    const formattedTime = deadline.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const tr = document.createElement('tr');
    tr.setAttribute('tabindex', '-1'); // Make row programmatically focusable
    tr.innerHTML = `
      <td>${e.id}</td>
      <td>${e.title}</td>
      <td>${e.type}</td>
      <td>${e.ects.toFixed(2)}</td>
      <td>${e.lecturer}</td>
      <td>
        <span class="status-badge not-registered">
          <img src="icons/not-registered-status.png" alt="" aria-hidden="true" />
          Not Registered
        </span>
      </td>
      <td>${formattedDate} at ${formattedTime}</td>
      <td>
        <a href="CourseDetails.html?course=${e.id}" class="btn view-registre-btn1" data-id="${e.id}" aria-label="View and register for ${e.title}">
          View &amp; Register
        </a>
      </td>`;
    tbody.appendChild(tr);
  });
  if (currentSearchTerm.length > 0) {
    setTimeout(() => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) {
        return; 
      }
      const firstRow = tbody.querySelector('tr');
      if (firstRow) firstRow.focus();
    }, 100); // Let input settle
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('.exam-registration-table');
  if (!table) return;

  renderExamRegistration();
  initColumnSorting();

  table.addEventListener('click', e => {
    if (!e.target.matches('.register-btn1')) return;
    const id = e.target.dataset.id;
    if (registerExam(id)) {
      renderExamRegistration();
      dispatchAppUpdate();
    }
  });

  const searchInput = document.getElementById('searchExamRegistration');
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
      renderExamRegistration(); // or renderMyExams()
    });
  }

  window.addEventListener('app:update', () => {
    renderExamRegistration();
  });

  const clearSearchBtn = document.getElementById('clearSearchBtn');
  if (clearSearchBtn && searchInput) {
    clearSearchBtn.style.display = 'none'; // Hide by default
    clearSearchBtn.setAttribute('aria-hidden', 'true');

    searchInput.addEventListener('input', () => {
      currentSearchTerm = searchInput.value.trim().toLowerCase();

      const visible = currentSearchTerm.length > 0;
      clearSearchBtn.style.display = visible ? 'flex' : 'none';
      clearSearchBtn.setAttribute('aria-hidden', !visible);

      renderExamRegistration();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchTerm = '';
      clearSearchBtn.style.display = 'none';
      clearSearchBtn.setAttribute('aria-hidden', 'true');
      renderExamRegistration();
    });
  }

});
