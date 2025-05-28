const _blocked = new Set();
// --- Notifications store for in-app alerts ---
const NOTIF_KEY = 'notificationsState';
// Seed a default "old" notification marked as read
const defaultNotifs = [
  {
    title: 'Registration Approval',
    msg: 'AI & Visualization exam registration is approved! Exam Location: HF101',
    timestamp: new Date('2024-11-01T09:00:00Z').toISOString(),
    read: true
  }
];

// Initialize notifications from sessionStorage or seed defaults
let _notifications = JSON.parse(
  sessionStorage.getItem(NOTIF_KEY) || JSON.stringify(defaultNotifs)
);
// Persist seeded defaults on first load
if (!sessionStorage.getItem(NOTIF_KEY)) {
  sessionStorage.setItem(NOTIF_KEY, JSON.stringify(_notifications));
}


/**
 * Adds a new notification message.
 * @param {string} msg - Human-readable text to show in the UI.
 */

export function addNotification(input) {
  const timestamp = new Date().toISOString();
  const notification = typeof input === 'string'
    ? { msg: input, timestamp, read: false }
    : { ...input, timestamp, read: false };
  _notifications.unshift(notification);
  if (_notifications.length > 50) _notifications.length = 50;
  // persist every time you add one
  sessionStorage.setItem(NOTIF_KEY, JSON.stringify(_notifications));
}

/** Returns the current list of notifications (most recent first). */
export function getNotifications() {
  return [..._notifications];
}

/** Clears all notifications (e.g. when user “views all”). */
export function clearNotifications() {
  _notifications = [];
  sessionStorage.removeItem(NOTIF_KEY);
}

const STORAGE_KEY = 'examsState';
// switch to sessionStorage (cleared when the tab/browser closes)
const storage = window.sessionStorage;

function _reviveDates(key, value) {
  // crude ISO‐8601 check
  if (typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
}

const saved = storage.getItem(STORAGE_KEY);
let exams;
if (saved) {
  exams = JSON.parse(saved, _reviveDates);
} else {
  exams = [
    {
      id: '344.011',
      title: 'Biometric Identification',
      type: 'VO',
      ects: 3.0, 
      lecturer: 'Josef Scharinger',
      registrationDeadline: new Date('2024-11-07T10:00'),
      examStart:            new Date('2024-11-11T10:15'),
      examEnd:              new Date('2024-11-11T11:45'),
      deregistrationDeadline:    new Date('2024-11-08T10:00'),
      status: 'not-registered' // or 'registered'
    },
    // 2) Upcoming session (starts 25 Nov 2024 at 14:00, ends registration 1 Mar 2025)
    {
      id: '344.011',
      title: 'Biometric Identification',
      type: 'VO',
      ects: 3.0,
      lecturer: 'Josef Scharinger',
    
      // registration only *from* 25.11.2024 14:00
      registrationStart:    new Date('2024-11-25T14:00'),
      registrationDeadline: new Date('2025-03-01T00:00'),  
      examStart:            new Date('2025-03-04T10:15'),
      examEnd:              new Date('2025-03-04T11:45'),
      dregistrationDeadline: new Date('2025-03-01T00:00'),
      status: 'not-registered'
    },
    
    {
      id: '353.068',
      title: 'Computer Forensics and IT Law',
      type: 'VL',
      ects: 3.0,
      lecturer: 'Michael Sonntag',
      registrationDeadline: new Date('2024-11-04T00:00'),
      examStart:            new Date('2024-11-07T10:30'),
      examEnd:              new Date('2024-11-07T12:00'),
      dregistrationDeadline: new Date('2024-11-04T00:00'),
      status: 'not-registered' // or 'registered'   
    },
    {
      id: '510.517',
      title: 'Information Security Managment',
      type: 'KV',
      ects: 3.0,
      lecturer: 'Stefan Rass, Maksim Goman',
      registrationDeadline: new Date('2025-01-10T00:00'),
      examStart:            new Date('2025-01-17T10:30'),
      examEnd:              new Date('2025-01-17T12:00'),
      dregistrationDeadline: new Date('2025-01-13T00:00'),
      status: 'not-registered' // or 'registered'   
    },
    {
      id: '353.067',
      title: 'Introduction to IT Security',
      type: 'VL',
      ects: 3.0,
      lecturer: 'Rene Mayrhofer',
      registrationDeadline: new Date('2025-01-14T23:59'),
      examStart:            new Date('2025-01-21T09:30'),
      examEnd:              new Date('2025-01-21T11:00'),
      dregistrationDeadline: new Date('2025-01-17T23:59'),
      status: 'not-registered' // or 'registered'   
    },
  
  
    {
      id: '140.008',
      title: 'AI & Law',
      examStart:            new Date('2024-12-10T12:00'),
      examEnd:              new Date('2024-12-10T13:30'),
      location:             null, // “To be notified”
      deregistrationDeadline:new Date('2024-11-04T10:00'),
      status:               'pending'
    },
    {
      id: '364.036',
      title: 'AI & Visualization',
      examStart:            new Date('2024-12-12T10:15'),
      examEnd:              new Date('2024-12-12T11:45'),
      location:             'HF101',
      deregistrationDeadline:new Date('2024-11-08T14:00'),
      status:               'registered'
    },
    {
      id: '353.020',
      title: 'Computer Networks',
      examStart:            new Date('2025-01-27T17:15'),
      examEnd:              new Date('2025-01-27T18:45'),
      location:             'HF201',
      deregistrationDeadline:new Date('2024-11-12T00:00'),
      status:               'registered'
    },
    {
      id: '335.025',
      title: 'Mobile Communication',
      examStart:            new Date('2025-01-28T15:30'),
      examEnd:              new Date('2025-01-28T17:00'),
      location:             null,
      deregistrationDeadline:new Date('2024-11-18T23:59'),
      status:               'pending'
    },
    {
      id: '365.231',
      title: 'Programming in Python II',
      examStart:            new Date('2024-11-04T13:00'),
      examEnd:              new Date('2024-11-04T14:30'),
      location:             'Online',
      deregistrationDeadline:new Date('2024-10-31T00:00'),
      status:               'registered'
    },
  ];
}


function save() {
    storage.setItem(STORAGE_KEY, JSON.stringify(exams));
}


export function getExamById(id) {
  // Handle composite ID format
  if (id.includes('|')) {
    const [baseId, iso] = id.split('|');
    return exams.find(e =>
      e.id === baseId &&
      e.examStart &&
      new Date(e.examStart).toISOString() === iso
    );
  }

  // Fallback for simple ID (used in dashboard)
  return exams.find(e => e.id === id);
}

export function registerExam(id, startTime = null) {
  const match = exams.find(e =>
    e.id === id &&
    (!startTime || (e.examStart && new Date(e.examStart).getTime() === new Date(startTime).getTime()))
  );

  if (!match || match.status === 'registered') return false;

  match.status = 'pending';
  match.uniqueKey = `${match.id}|${match.examStart.toISOString()}`;

  // Fix: fallback deadline if missing (avoids crash)
  if (!match.deregistrationDeadline) {
    match.deregistrationDeadline = new Date(match.registrationDeadline || match.examStart);
  }

  save();
  addNotification({
  title: 'Registration Confirmation',
  msg: `You have successfully registered for “${match.title}”.`
  });
  dispatchAppUpdate();
  return true;
}

export function deregisterExam(id) {
  const ex = getExamById(id);
  if (!ex || (ex.status !== 'registered' && ex.status !== 'pending')) return false;
  ex.status = 'deregistered';
  _blocked.add(ex.id); // block just the base ID
  save();
  return true;
}

/** Exams the student can still register for */
export function getAvailableExams({ onlyActive = false } = {}) {
  const now = new Date('2024-11-01T00:00:00');

  if (!onlyActive) {
    return exams.filter(
      e => e.status === 'not-registered' && !_blocked.has(e.id)
    );
  }

  const filtered = {};
  exams.forEach(e => {
    if (e.status !== 'not-registered') return;
    const regStart = e.registrationStart ?? new Date(0);
    const regEnd = e.registrationDeadline;
    const isOpen = now >= regStart && now <= regEnd;
    const key = e.id;

    if (!isOpen) return;
    if (!filtered[key] || (filtered[key].examStart > e.examStart)) {
      filtered[key] = e;
    }
  });

  return Object.values(filtered);
}

/** Exams the student has registered for */
export function getRegisteredExams() {
  // re-hydrate our in-memory array from storage on *every* call:
  const saved = storage.getItem(STORAGE_KEY);
  if (saved) {
    exams = JSON.parse(saved, _reviveDates);
  }
  return exams.filter(e => e.status === 'registered' || e.status === 'pending');
}

export function dispatchAppUpdate() {
  window.dispatchEvent(new CustomEvent('app:update'));
}

/** Returns number of unread notifications */
export function getUnreadCount() {
  return _notifications.filter(n => !n.read).length;
}

/** Mark every notification as “read” (so the dot disappears) */
export function markAllRead() {
  _notifications = _notifications.map(n => ({ ...n, read: true }));
  // persist the new read-state
  sessionStorage.setItem(NOTIF_KEY, JSON.stringify(_notifications));
}
/**
 * Remove a single notification by timestamp, persist it,
 * and blast out an app:update so everyone re-renders.
 */
export function removeNotification(timestamp) {
  _notifications = _notifications.filter(n => n.timestamp !== timestamp);
  sessionStorage.setItem(NOTIF_KEY, JSON.stringify(_notifications));
  dispatchAppUpdate();
}
