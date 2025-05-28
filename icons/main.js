// Accessible exam events from your data
const events = [  
  { title: 'Exam: Programming in Python II', datetime: '2024-12-10T13:00-14:30', category: 'exam-date' },
  { title: 'Exam: AI & Law', datetime: '2024-12-10T12:00-13:30', category: 'exam-date' },
  { title: 'Deregistration: AI & Law', datetime: '2024-11-08T8:00-10:00', category: 'deregistration-deadline' },
  { title: 'Exam: AI & Visualization', datetime: '2024-12-12T10:15-11:45', category: 'exam-date' },
  { title: 'Deregistration: AI & Visualization', datetime: '2024-11-08T8:00-14:00', category: 'deregistration-deadline' },
  { title: 'Exam: Computer Networks', datetime: '2025-01-27T17:15-18:45', category: 'exam-date' },
  { title: 'Deregistration: Computer Networks', datetime: '2024-11-12T8:00-01:00', category: 'deregistration-deadline' },
  { title: 'Exam: Mobile Communication', datetime: '2025-01-28T15:30-17:00', category: 'exam-date' },
  { title: 'Deregistration: Mobile Communication', datetime: '2024-11-18T8:00-00:00', category: 'deregistration-deadline' },
  { title: 'Registration: Biometric Identification', datetime: '2024-11-07T8:00-10:00', category: 'registration-deadline' },
  { title: 'Registration: Computer Forensics and IT Law', datetime: '2024-11-11T8:00-00:00', category: 'registration-deadline' },
  { title: 'Registration: Information Security Managment', datetime: '2025-01-10T8:00-00:00', category: 'registration-deadline' },
  { title: 'Registration: Introduction to IT Security', datetime: '2025-01-14T8:00-23:59', category: 'registration-deadline' }
];

let currentDate = new Date("2024-11-01");
let currentView = "month";

const calendarHeader = document.querySelector('.calendar-current-date');
const viewButtons = document.querySelectorAll('.view-toggle');
const views = {
  month: document.getElementById('month-view'),
  week: document.getElementById('week-view'),
  day: document.getElementById('day-view')
};

function updateCalendarHeader() {
  if (currentView === 'month') {
    calendarHeader.textContent = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } else if (currentView === 'week') {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    start.setDate(currentDate.getDate() + diff);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    calendarHeader.textContent = `${startStr} - ${endStr}`;
  } else {
    calendarHeader.textContent = currentDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}

function renderWeekTable() {
  const weekTable = document.querySelector(".week-table tbody");
  weekTable.innerHTML = "";
  const hours = Array.from({ length: 17 }, (_, i) => (8 + i) % 24);
  const weekdays = 7;

  for (let hour of hours) {
    const row = document.createElement("tr");
    const timeCell = document.createElement("td");
    timeCell.classList.add("time-column");
    timeCell.textContent = `${hour === 0 ? '00' : hour}:00`;
    row.appendChild(timeCell);

    for (let day = 0; day < weekdays; day++) {
      const cell = document.createElement("td");
      if (day === 5 || day === 6) cell.classList.add("weekend");
      row.appendChild(cell);
    }
    weekTable.appendChild(row);
  }
}

function renderDayTable() {
  const dayTable = document.querySelector(".day-table tbody");
  dayTable.innerHTML = "";
  const hours = Array.from({ length: 17 }, (_, i) => (8 + i) % 24);

  for (let hour of hours) {
    const row = document.createElement("tr");
    const timeCell = document.createElement("td");
    timeCell.classList.add("time-column");
    timeCell.textContent = `${hour === 0 ? '00' : hour}:00`;
    row.appendChild(timeCell);

    const cell = document.createElement("td");
    row.appendChild(cell);
    dayTable.appendChild(row);
  }
}

function renderEvents() {
  document.querySelectorAll('.calendar-event').forEach(el => el.remove());

  events.forEach(event => {
    const eventDate = new Date(event.datetime);
    const eventDay = eventDate.getDate();
    const eventMonth = eventDate.getMonth();
    const eventYear = eventDate.getFullYear();

    if (currentView === 'month') {
      const cell = [...document.querySelectorAll('.month-table td')].find(td => {
        return td.querySelector('.date-num')?.textContent == eventDay &&
               currentDate.getMonth() === eventMonth &&
               currentDate.getFullYear() === eventYear;
      });
      if (cell) cell.appendChild(createEventElement(event));
    }

    if (currentView === 'week') {
      const start = new Date(currentDate);
      const day = start.getDay();
      const diff = (day === 0 ? -6 : 1) - day;
      start.setDate(currentDate.getDate() + diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      if (eventDate >= start && eventDate <= end) {
        const rows = document.querySelectorAll('.week-table tbody tr');
        const hour = eventDate.getHours();
        const colIndex = (eventDate.getDay() + 6) % 7 + 1;
        const rowIndex = (hour === 0 ? 16 : hour - 8);
        if (rows[rowIndex] && rows[rowIndex].children[colIndex]) {
          rows[rowIndex].children[colIndex].appendChild(createEventElement(event));
        }
      }
    }

    if (currentView === 'day') {
      if (eventDate.toDateString() === currentDate.toDateString()) {
        const rows = document.querySelectorAll('.day-table tbody tr');
        const hour = eventDate.getHours();
        const rowIndex = (hour === 0 ? 16 : hour - 8);
        if (rows[rowIndex]) {
          rows[rowIndex].children[1].appendChild(createEventElement(event));
        }
      }
    }
  });
}

function createEventElement(event) {
  const a = document.createElement('a');
  a.href = event.category === 'exam-date' ? 'MyExams.html' : 'ExamRegistration.html';
  a.className = `calendar-event ${event.category}`;
  a.setAttribute('tabindex', 0);
  a.setAttribute('aria-label', event.title);
  a.innerHTML = `<span class="event-title">${event.title}</span>`;
  return a;
}

function switchView(view) {
  currentView = view;
  for (let key in views) {
    views[key].style.display = key === view ? 'block' : 'none';
    views[key].setAttribute('aria-hidden', key !== view);
  }

  viewButtons.forEach(btn => btn.setAttribute('aria-pressed', btn.dataset.view === view));
  updateCalendarHeader();
  if (view === "month") renderMonthTable();
  if (view === "week") renderWeekTable();
  if (view === "day") renderDayTable();
  renderEvents();
}

function renderMonthTable() {
  const tableBody = document.querySelector(".month-table tbody");
  tableBody.innerHTML = "";
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const daysInMonth = end.getDate();
  const firstDay = (start.getDay() + 6) % 7;

  let date = 1;
  for (let i = 0; i < 6; i++) {
    let row = document.createElement("tr");
    let hasDate = false;
    for (let j = 0; j < 7; j++) {
      let cell = document.createElement("td");
      let span = document.createElement("span");
      span.className = "date-num";
      if (i === 0 && j < firstDay) {
        span.textContent = "";
      } else if (date > daysInMonth) {
        span.textContent = "";
      } else {
        span.textContent = date;
        date++;
        hasDate = true;
      }
      cell.appendChild(span);
      if (j === 5 || j === 6) cell.classList.add("weekend");
      row.appendChild(cell);
    }
    if (hasDate) tableBody.appendChild(row);
  }
}

document.querySelector('.prev-btn').addEventListener('click', () => {
  if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() - 1);
  else if (currentView === 'week') currentDate.setDate(currentDate.getDate() - 7);
  else currentDate.setDate(currentDate.getDate() - 1);
  updateCalendarHeader();
  if (currentView === "month") renderMonthTable();
  if (currentView === "week") renderWeekTable();
  if (currentView === "day") renderDayTable();
  renderEvents();
});

document.querySelector('.next-btn').addEventListener('click', () => {
  if (currentView === 'month') currentDate.setMonth(currentDate.getMonth() + 1);
  else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + 7);
  else currentDate.setDate(currentDate.getDate() + 1);
  updateCalendarHeader();
  if (currentView === "month") renderMonthTable();
  if (currentView === "week") renderWeekTable();
  if (currentView === "day") renderDayTable();
  renderEvents();
});

viewButtons.forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

updateCalendarHeader();
switchView(currentView);
