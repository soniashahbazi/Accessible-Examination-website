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
  const clearBtn = document.getElementById('clearSearchBtn');
  const container =
    document.getElementById('full-notification-list') ||
    document.getElementById('notification-list');
  const resultCount = document.getElementById('notification-result-count');

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

  if (!searchInput || !container) {
    console.warn('Notification search or container not found');
    return;
  }

  searchInput.setAttribute('aria-controls', container.id);
  if (resultCount) {
    resultCount.setAttribute('role', 'status');
    resultCount.setAttribute('aria-live', 'polite');
    resultCount.setAttribute('aria-atomic', 'true');
  }

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.trim().toLowerCase();

    const oldMsg = container.querySelector('.no-notif-msg');
    if (oldMsg) oldMsg.remove();

    if (term === '') {
      if (container.id === 'full-notification-list') {
        renderFullNotifications();
      }
      if (resultCount) resultCount.textContent = '';
      return;
    }

    const items = Array.from(
      container.querySelectorAll('.notif-item, .notif-item--small')
    );

    let visible = 0;
    items.forEach(item => {
      const match = item.textContent.toLowerCase().includes(term);
      item.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    if (visible === 0) {
      const msg = document.createElement('p');
      msg.className = 'no-notif-msg';
      msg.setAttribute('role', 'status');
      msg.setAttribute('aria-live', 'polite');
      msg.textContent = 'No notifications found.';
      container.appendChild(msg);
    }

    if (resultCount) {
      resultCount.textContent = `${visible} notification${visible === 1 ? '' : 's'} found.`;
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
