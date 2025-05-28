// 📁 js/main.js
import { deregisterExam, dispatchAppUpdate, addNotification } from './examService.js';


let triggeringBtn = null;
let targetCourse = '';
let targetCourseId = '';

function setupSearch() {
  const searchConfigs = [
    { inputId: 'searchDashboard', sectionSelector: '[data-section]', multipleTables: true },
  ];

  searchConfigs.forEach(({ inputId, sectionSelector, multipleTables }) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    if (inputId === 'searchDashboard') {
      const clearBtn = document.getElementById('clearSearchBtn');
      if (clearBtn) {
        const toggleClearBtn = () => {
          clearBtn.style.display = input.value.trim() ? 'flex' : 'none';
        };
        toggleClearBtn();
        input.addEventListener('input', toggleClearBtn);
        clearBtn.addEventListener('click', () => {
          input.value = '';
          input.dispatchEvent(new Event('input'));
          input.focus();
        });
      }
    }

    const tables = multipleTables
      ? document.querySelectorAll(`${sectionSelector} .table-container table`)
      : [document.querySelector(`${sectionSelector} .table-container table`)].filter(Boolean);

    if (!tables.length) return;

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let anyVisible = false;

      tables.forEach(table => {
        const rows = Array.from(table.tBodies[0].rows);
        let tableHasVisibleRows = false;

        rows.forEach(row => {
          const show = q === '' || row.textContent.toLowerCase().includes(q);
          row.style.display = show ? '' : 'none';
          if (show) tableHasVisibleRows = true;
        });

        anyVisible = anyVisible || tableHasVisibleRows;
        table.style.display = tableHasVisibleRows ? '' : 'none';
      });

      const section = document.querySelector(sectionSelector);
      if (section) section.style.display = anyVisible || q === '' ? '' : 'none';
      const feedback = document.getElementById(`${inputId}-count`);
      if (feedback) {
        // count visible rows across all tables
        const visibleCount = Array.from(tables).reduce((sum, table) => {
          return (
            sum +
            Array.from(table.tBodies[0].rows).filter(r => r.style.display !== 'none')
              .length
          );
        }, 0);
        feedback.textContent =
          q === ''
            ? ''
            : `${visibleCount} item${visibleCount === 1 ? '' : 's'} found.`;
      }
    });
  });
}

function setupDeregisterDialog() {
  const dialog = document.getElementById('confirmDereg');
  const msgElm = document.getElementById('confirmDeregMsg');
  const yesBtn = document.getElementById('confirmYes');
  const noBtn  = document.getElementById('confirmNo');

  // ❗ Check everything is loaded first
  if (!dialog || !msgElm || !yesBtn || !noBtn) return;

  // Register dialog polyfill after confirming the element exists
  if (typeof dialog.showModal !== 'function') {
    console.warn('Registering dialog polyfill');
    dialogPolyfill.registerDialog(dialog);
  }
  // Delegated listener always fires
  document.addEventListener('click', e => {
    const btn = e.target.closest('button.deregister-btn');
    if (!btn || !btn.dataset.id) return;

    e.preventDefault();
    triggeringBtn = btn;
    targetCourseId = btn.dataset.id;

    const row = btn.closest('tr');
    const headers = Array.from(row.closest('table').querySelectorAll('thead th'));
    const titleIdx = headers.findIndex(th => /^(Course Title|Exam Name)$/i.test(th.textContent.trim()));
    const cell = row.cells[titleIdx >= 0 ? titleIdx : 1];
    const span = cell.querySelector('.exam-name');
    targetCourse = span ? span.textContent.trim() : cell.textContent.trim();

    msgElm.textContent = `Are you sure you want to deregister for “${targetCourse}”?`;
    dialog.showModal();
    noBtn.focus();
  });

  noBtn.addEventListener('click', () => {
    dialog.close();
    triggeringBtn?.focus();
  });

  yesBtn.addEventListener('click', () => {
    if (deregisterExam(targetCourseId)) {
      addNotification({
        title: 'Deregistration Confirmation',
        msg: `${targetCourse} exam is successfully deregistered!`
      });
      dispatchAppUpdate();
    }
    dialog.close();
    triggeringBtn?.focus();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  setupDeregisterDialog();
});

