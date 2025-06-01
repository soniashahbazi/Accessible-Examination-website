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

          // 🔧 Also hide the skip-to-results links
          const skipLinks = document.querySelectorAll('.skip-to-results');
          skipLinks.forEach(link => {
            link.style.display = 'none';
            link.setAttribute('aria-hidden', 'true');
            link.setAttribute('tabindex', '-1');
          });
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
      // Ensure skip links are hidden if input is cleared
      const skipLinks = document.querySelectorAll('.skip-to-results');
      if (q === '') {
        skipLinks.forEach(link => {
          link.classList.add('sr-only');
          link.setAttribute('aria-hidden', 'true');
          link.setAttribute('tabindex', '-1');
        });
      }

      tables.forEach(table => {
        const rows = Array.from(table.tBodies[0].rows);
        let tableHasVisibleRows = false;

        rows.forEach(row => {
          if (row.classList.contains('fallback-row')) return; // skip fallback row
          const show = q === '' || row.textContent.toLowerCase().includes(q);
          row.style.display = show ? '' : 'none';
          if (show) tableHasVisibleRows = true;
        });

        const fallbackId = `${table.id}-fallback`;
        let fallbackRow = table.querySelector(`#${fallbackId}`);

        if (!tableHasVisibleRows) {
          if (!fallbackRow) {
            fallbackRow = document.createElement('tr');
            fallbackRow.id = fallbackId;
            fallbackRow.classList.add('fallback-row');
            fallbackRow.setAttribute('role', 'row');
            fallbackRow.setAttribute('tabindex', '-1'); // allow focus

            const message = table.id.includes('deregistration')
              ? 'No upcoming deregistration deadlines found.'
              : 'No upcoming registration deadlines found.';

            fallbackRow.setAttribute('aria-label', message);
            fallbackRow.innerHTML = `<td colspan="3">${message}</td>`;
            table.tBodies[0].appendChild(fallbackRow);
          }
        } else if (fallbackRow) {
          fallbackRow.remove();
        }

        // ── SHOW or HIDE the “Skip to …” link for this table ──
        const container = table.closest('.table-container');
        const anchorDiv = container.querySelector('div[id]');
        if (anchorDiv) {
          const skipLink = document.querySelector(
            `.skip-to-results[href="#${anchorDiv.id}"]`
          );
          if (skipLink) {
            const isInputVisible = input.offsetParent !== null;
            const showSkipLink = tableHasVisibleRows && isInputVisible;

            skipLink.classList.toggle('sr-only', !showSkipLink);
            skipLink.setAttribute('aria-hidden', String(!showSkipLink));
            skipLink.setAttribute('tabindex', showSkipLink ? '0' : '-1');
          }

        }

        anyVisible = anyVisible || tableHasVisibleRows;
        table.style.display = ''; //keep the table visible
        // Count and announce how many results per section
        const visibleCount = rows.filter(r => {
          return !r.classList.contains('fallback-row') && r.style.display !== 'none';
        }).length;

        const feedbackId = table.id.includes('deregistration')
          ? 'deregistration-results-feedback'
          : 'registration-results-feedback';

        const feedbackEl = document.getElementById(feedbackId);
          if (feedbackEl) {
            const sectionLabel = table.id.includes('deregistration')
              ? 'in upcoming exam deregistration deadlines'
              : 'in upcoming exam registration deadlines';

            feedbackEl.textContent = q === ''
              ? ''
              : `${visibleCount} result${visibleCount === 1 ? '' : 's'} found ${sectionLabel}.`;
          }

      });

      // Always show section, even if no rows are matched
      // Keeps headings visible and context clear
      if (section) section.style.display = '';

      const feedback = document.getElementById(`${inputId}-count`);
      if (feedback) {
        const registrationTable = Array.from(tables).find(t => t.id.includes('registration'));
        const deregistrationTable = Array.from(tables).find(t => t.id.includes('deregistration'));

        const regVisible = registrationTable
          ? Array.from(registrationTable.tBodies[0].rows).filter(r => r.style.display !== 'none' && !r.classList.contains('fallback-row')).length
          : 0;

        const deregVisible = deregistrationTable
          ? Array.from(deregistrationTable.tBodies[0].rows).filter(r => r.style.display !== 'none' && !r.classList.contains('fallback-row')).length
          : 0;

        feedback.textContent = q === ''
          ? ''
          : `${regVisible} result${regVisible === 1 ? '' : 's'} found in upcoming exam registration deadlines. ` +
            `${deregVisible} result${deregVisible === 1 ? '' : 's'} found in upcoming exam deregistration deadlines.`;
      }

    });
  });
}

function setupDeregisterDialog() {
  const dialog = document.getElementById('confirmDereg');
  const msgElm = document.getElementById('confirmDeregMsg');
  const yesBtn = document.getElementById('confirmYes');
  const noBtn  = document.getElementById('confirmNo');

  if (!dialog || !msgElm || !yesBtn || !noBtn) return;

  if (typeof dialog.showModal !== 'function') {
    dialogPolyfill.registerDialog(dialog);
  }

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

    msgElm.textContent = `Do you want to deregister from “${targetCourse}”?`;

    dialog.showModal();
    noBtn.focus();
  });

  noBtn.addEventListener('click', () => {
    dialog.close();
    triggeringBtn?.focus();
  });

  yesBtn.addEventListener('click', () => {
    const success = deregisterExam(targetCourseId);
    if (success) {
      setTimeout(() => {
        dialog.close();
        setTimeout(() => {
          triggeringBtn?.focus();
        }, 300);
      }, 400);
    } else {
      dialog.close();
      triggeringBtn?.focus();
    }
  });

  // 🔒 Trap focus inside the dialog
  dialog.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      const focusable = Array.from(dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
        .filter(el => !el.disabled && el.offsetParent !== null); // visible elements

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  });
}


function setupSkipToResults() {
  const skipLinks = document.querySelectorAll('.skip-to-results');

  skipLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const targetId = link.getAttribute('href')?.replace('#', '');
      const targetAnchor = document.getElementById(targetId);

      // Safely find next sibling table
      const sectionTable = targetAnchor?.nextElementSibling?.tagName === 'TABLE'
        ? targetAnchor.nextElementSibling
        : targetAnchor?.querySelector('table');

      if (!sectionTable) return;

      // Focus first visible row (data or fallback)
      const rows = Array.from(sectionTable.querySelectorAll('tbody tr'));
      const firstVisibleRow = rows.find(r => r.style.display !== 'none') || rows[0];

      if (firstVisibleRow) {
        firstVisibleRow.setAttribute('tabindex', '-1');
        setTimeout(() => {
          // focus whatever actionable element is in the row (link or button)
          const actionEl = firstVisibleRow.querySelector('a, button');
          if (actionEl) {
            actionEl.focus({ preventScroll: false });
          } else {
            // fallback to focusing the row itself
            firstVisibleRow.focus({ preventScroll: false });
          }

          // Announce the contents of the row
          let tableTitle = '';
          if (tableCaption) {
            tableTitle = tableCaption.innerText;
          } else if (sectionTable.getAttribute('aria-labelledby')) {
            const headingId = sectionTable.getAttribute('aria-labelledby');
            const headingEl = document.getElementById(headingId);
            tableTitle = headingEl?.innerText || '';
          }
        }, 50);
      }

    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupSearch();
  setupDeregisterDialog();
  setupSkipToResults();
});