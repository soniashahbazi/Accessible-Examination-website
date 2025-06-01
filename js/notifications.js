// notifications.js
import {
  getNotifications,
  getUnreadCount,
  markAllRead,
  removeNotification
} from './examService.js';

document.addEventListener('DOMContentLoaded', () => {
  const bell      = document.getElementById('notification-bell');
  const panel     = document.getElementById('notification-panel');
  const list      = document.getElementById('notification-list');
  const closeBtn  = document.getElementById('notification-close');
  const viewAll   = document.getElementById('notification-view-all');
  const liveNotif = document.getElementById('liveNotif');

  function renderNotifications() {
    const items       = getNotifications();
    const unreadCount = getUnreadCount();

    // ■ Dot on the bell
    let badge = bell.querySelector('.badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'badge';
      bell.appendChild(badge);
    }
    badge.style.display = unreadCount > 0 ? 'block' : 'none';
    badge.setAttribute('aria-label', `${unreadCount} unread notifications`);

    // ■ List inside the panel
    if (items.length === 0) {
      list.innerHTML = '<li class="no-notifications-msg">No notifications</li>';
    } else {
      list.innerHTML = items.map(n => {
        let typeClass = '';
        if (n.title === 'Registration Confirmation') typeClass = 'notif-registration';
        else if (n.title === 'Deregistration Confirmation') typeClass = 'notif-deregistration';
        else if (n.title === 'Registration Approval') typeClass = 'notif-registration-approval';

        const cls = `${n.read ? '' : 'notification-unread'} ${typeClass}`.trim();
        const plainMsg = n.msg.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        const ariaDescription = `${n.title}: ${plainMsg}`;
        let courseMatch = n.msg.match(/“([^”]+)”/);
        if (!courseMatch) {
          courseMatch = n.msg.match(/^([^!:.]+?) exam/i); // fallback match
        }
        const courseName = courseMatch ? courseMatch[1].trim() : 'this course';
        const dismissLabel = `Dismiss ${n.title} for ${courseName}`;

        return `
          <li
            role="listitem"
            tabindex="0"
            aria-label="${ariaDescription}"
            class="notif-item notif-item--small ${n.read ? 'read' : 'unread'} ${typeClass}"
            data-timestamp="${n.timestamp}"
          >
            <div class="notif-header-bar">
              <div class="notif-title-container">
                <div class="notif-icon ${typeClass}-icon" aria-hidden="true"></div>
                <div class="notif-title">${n.title}</div>
              </div>
              <button class="notif-close-btn" aria-label="${dismissLabel}">×</button>
            </div>
            <div class="notif-msg">
              ${n.msg.includes('Exam Location:')
                ? n.msg.replace(' Exam Location:', '<br><span class="notif-location">Exam Location:') + '</span>'
                : n.msg}
            </div>
          </li>
        `;
      }).join('');

    }

    // Bind close buttons after rendering
    list.querySelectorAll('.notif-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ts = btn.closest('.notif-item').dataset.timestamp;
        removeNotification(ts);
      });
    });
  }

  announceLatest()
  
  // ■ Toggle panel open/close (using hidden + focus management)
  bell.addEventListener('click', () => {
    const opening = panel.hasAttribute('hidden');
    // 1) Show or hide via the HTML hidden attribute
    panel.hidden = !opening;
    // 2) Reflect state on the bell for AT
    bell.setAttribute('aria-expanded', String(opening));

    if (opening) {
      // we just opened it → mark as read, re-render, announce, and move focus in
      markAllRead();
      renderNotifications();
      announceLatest();
      closeBtn.focus();
    } else {
      // we just closed it → return focus to the bell
      bell.focus();
    }
  });

  
  // ■ Close via “×” (using hidden + focus return)
  closeBtn.addEventListener('click', () => {
    panel.hidden = true;
    bell.setAttribute('aria-expanded', 'false');
    bell.focus();
  });

  // ■ “View All” navigation
  viewAll.addEventListener('click', () => {
    window.location.href = 'Notifications.html';
  });

  // ■ Re‐render on app updates
  window.addEventListener('app:update', () => {
    renderNotifications();
    announceLatest();
  });

  // Initial draw
  renderNotifications();
  
});
function announceLatest() {
  const unreadItems = getNotifications().filter(n => !n.read);
  if (unreadItems.length && liveNotif) {
    // Force change: clear + delay before setting content
    liveNotif.textContent = '';
    setTimeout(() => {
      liveNotif.textContent = `New notification: ${unreadItems[0].msg}`;
    }, 100); // this delay helps screen readers perceive change
  }
}


