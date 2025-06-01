// 📁 js/notificationPage.js
import { getNotifications, markAllRead, removeNotification } from './examService.js';

function renderFullNotifications() {
  const container = document.getElementById('full-notification-list');
  if (!container) return;
  markAllRead();
  const countEl = document.getElementById('notification-result-count');
  const items = getNotifications();
  if (countEl) {
    countEl.textContent =
      items.length === 0
        ? 'No notifications'
        : `${items.length} notification${items.length === 1 ? '' : 's'}.`;
  }

  if (items.length === 0) {
    container.innerHTML = '<p class="no-notif-msg">No notifications</p>';
  } else {
    container.innerHTML = items.map(n => {
      let typeClass = '';
      if (n.title === 'Registration Confirmation')        typeClass = 'notif-registration';
      else if (n.title === 'Deregistration Confirmation') typeClass = 'notif-deregistration';
      else if (n.title === 'Registration Approval')       typeClass = 'notif-registration-approval';

      return `
        <div class="notif-item ${n.read ? 'read' : 'unread'} ${typeClass}" data-timestamp="${n.timestamp}">
          <div class="notif-header-bar">
            <div class="notif-title-container">
              <div class="notif-icon ${typeClass}-icon" aria-hidden="true"></div>
              <div class="notif-title">${n.title}</div>
            </div>
            <button class="notif-close-btn" aria-label="Dismiss notification">×</button>
          </div>
          <div class="notif-msg">${n.msg}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.notif-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const notifElm = btn.closest('.notif-item');
        removeNotification(notifElm.dataset.timestamp);
        notifElm.remove();
        if (!container.querySelector('.notif-item')) {
          container.innerHTML = '<p class="no-notif-msg">No notifications</p>';
        }
      });
    });
  }
}

function wireSearchFilter() {
  const searchInput = document.getElementById('searchNotifications');
  const clearBtn     = document.getElementById('clearSearchBtn');
  const container    = document.getElementById('full-notification-list')
                      || document.getElementById('notification-list');
  const resultCount  = document.getElementById('notification-result-count');
  const skipLink     = document.querySelector('.skip-to-results[href="#full-notification-list"]');

  if (!searchInput || !container) {
    console.warn('Notification search or container not found');
    return;
  }

  // Make our live-region polite and atomic
  if (resultCount) {
    resultCount.setAttribute('role', 'status');
    resultCount.setAttribute('aria-live', 'polite');
    resultCount.setAttribute('aria-atomic', 'true');
  }

  // 1️⃣ Clear-button show/hide
  if (clearBtn) {
    const toggleClear = () => {
      clearBtn.style.display = searchInput.value.trim() ? 'flex' : 'none';
    };
    toggleClear();
    searchInput.addEventListener('input', toggleClear);
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
      toggleClear();
    });
  }

  // 2️⃣ Skip link click → focus first visible notification
  if (skipLink && !skipLink._attached) {
    skipLink._attached = true;
    skipLink.addEventListener('click', evt => {
      evt.preventDefault();
      const firstVisible = Array.from(
        container.querySelectorAll('.notif-item')
      ).find(item => item.style.display !== 'none');
      if (firstVisible) {
        firstVisible.setAttribute('tabindex', '-1');
        firstVisible.focus({ preventScroll: false });
      }
    });
  }

  // 3️⃣ Main search handler
  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();

    // if empty, re-render full set
    if (term === '') {
      renderFullNotifications();
      if (resultCount) resultCount.textContent = '';
      if (skipLink)   skipLink.setAttribute('aria-hidden', 'true');
      return;
    }

    // filter each .notif-item by title+msg
    const items = Array.from(container.querySelectorAll('.notif-item'));
    let visible = 0;

    items.forEach(item => {
      const text = item.querySelector('.notif-title').textContent +
                   ' ' +
                   item.querySelector('.notif-msg').textContent;
      const match = text.toLowerCase().includes(term);
      item.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    // if none matched, show a single “no notifications found” line
    let noMsg = container.querySelector('.no-notif-msg');
    if (visible === 0) {
      if (!noMsg) {
        noMsg = document.createElement('p');
        noMsg.className = 'no-notif-msg';
        noMsg.setAttribute('role', 'status');
        noMsg.setAttribute('aria-live', 'polite');
        noMsg.textContent = 'No notifications found.';
        container.appendChild(noMsg);
      }
    } else if (noMsg) {
      noMsg.remove();
    }

    // update live region
    if (resultCount) {
      resultCount.textContent = `${visible} notification${visible === 1 ? '' : 's'} found.`;
    }
    // toggle skip-link visibility
    if (skipLink) {
      skipLink.setAttribute('aria-hidden', visible === 0 ? 'true' : 'false');
    }
  });
}


document.addEventListener('DOMContentLoaded', () => {
  renderFullNotifications();
  wireSearchFilter();
});

window.addEventListener('app:update', () => {
  renderFullNotifications();
  wireSearchFilter();
});

export { renderFullNotifications };
