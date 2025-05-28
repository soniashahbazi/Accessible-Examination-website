// Use examService for dynamic events
import { getRegisteredExams, getAvailableExams } from './examService.js';
if (document.querySelector('.calendar-current-date')) {
    // Generate events dynamically
    function generateEvents() {
      const events = [];
      // registration deadlines
      getAvailableExams({ onlyActive: true  }).forEach(e => {
        if (e.registrationDeadline) events.push({
          title: `Registration Deadline: ${e.title}`,
          start: e.registrationDeadline.toISOString(),
          end:   e.registrationDeadline.toISOString(),
          category: 'registration-deadline'
        });
      });
      // exam dates & deregistration deadlines
      getRegisteredExams().forEach(e => {
        if (e.examStart && e.examEnd) events.push({
          title: `Exam Date: ${e.title}`,
          start: e.examStart.toISOString(),
          end:   e.examEnd.toISOString(),
          category: 'exam-date'
        });
        if (e.deregistrationDeadline) events.push({
          title: `Deregistration Deadline: ${e.title}`,
          start: e.deregistrationDeadline.toISOString(),
          end:   e.deregistrationDeadline.toISOString(),
          category: 'deregistration-deadline'
        });
      });
      return events;
    }

  
    // Split title into label (with colon) and course name
    function createEventElement(event) {
      const idx        = event.title.indexOf(':');
      const labelText  = idx >= 0 ? event.title.slice(0, idx + 1) : '';
      const courseText = idx >= 0 ? event.title.slice(idx + 1).trim() : event.title;
  
      const a = document.createElement('a');
      // **deregistration** now goes to MyExams.html
      if (event.category === 'exam-date' || event.category === 'deregistration-deadline')
        a.href = 'MyExams.html';
      else
        a.href = 'ExamRegistration.html';
  
      a.className = `calendar-event ${event.category}`;
      a.setAttribute('tabindex', 0);
  
      const startTime = new Date(event.start)
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(event.end)
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
      a.setAttribute(
        'aria-label',
        `${labelText} ${courseText}, from ${startTime} to ${endTime}`
      );
  
      a.innerHTML = `
        <span class="event-label">${labelText}</span>
        <span class="event-course">${courseText}</span>
      `;
      return a;
    }
  
    // Current “today” for testing
    const todayDate = new Date("2024-11-01"); // Fixed "today" date
    let currentDate = new Date(todayDate); // Start with "today" as the current
    let currentView = "month";
  
    const calendarHeader = document.querySelector('.calendar-current-date');
    const viewButtons    = document.querySelectorAll('.view-toggle');
    const views = {
      month: document.getElementById('month-view'),
      week:  document.getElementById('week-view'),
      day:   document.getElementById('day-view')
    };
  
    function updateCalendarHeader() {
      if (currentView === 'month') {
        calendarHeader.textContent = currentDate.toLocaleDateString('en-US', {
          month: 'long', year: 'numeric'
        });
      } else if (currentView === 'week') {
        const start = new Date(currentDate);
        const diff = (start.getDay() + 6) % 7;
        start.setDate(currentDate.getDate() - diff);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
      
        // Check if the start and end months are the same
        if (start.getMonth() === end.getMonth()) {
          calendarHeader.textContent = `${start.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'  
          })} - ${end.getDate()}, ${start.getFullYear()}`; 
        } else {
          calendarHeader.textContent =
            `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}` +
            ' – ' +
            `${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
        }
      } else {
        const monthDay = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        calendarHeader.textContent = `${monthDay}, ${weekday}`; // Format: "November 3, Friday"
      }
    }
  
    // ───────────────────────────────────────────────────────────
    // MONTH, WEEK & DAY renderers (unchanged except for “today”)
    // ───────────────────────────────────────────────────────────
    function renderMonthTable() {
      const tbody       = document.querySelector(".month-table tbody");
      tbody.innerHTML   = "";
      const Y           = currentDate.getFullYear();
      const M           = currentDate.getMonth();
      const daysInMonth = new Date(Y, M+1, 0).getDate();
      const firstDay    = (new Date(Y, M, 1).getDay() + 6) % 7;
  
      let day = 1;
      for (let w = 0; w < 6; w++) {
        const row = document.createElement("tr");
        let hasDate = false;
        for (let dow = 0; dow < 7; dow++) {
          const cell = document.createElement("td");
          const span = document.createElement("span");
          span.className = "date-num";
          if ((w===0 && dow<firstDay) || day>daysInMonth) {
            span.textContent = "";
          } else {
            span.textContent = day;
            hasDate = true;
            // highlight today
            const cellDate = new Date(Y, M, day);
            if (
              cellDate.getDate() === todayDate.getDate() &&
              cellDate.getMonth() === todayDate.getMonth() &&
              cellDate.getFullYear() === todayDate.getFullYear()
            ) {
              cell.classList.add("today");
            }
            day++;
          }
          cell.appendChild(span);
          if (dow >= 5) cell.classList.add("weekend");
          row.appendChild(cell);
        }
        if (!hasDate) break;
        tbody.appendChild(row);
      }
    }
  
    function renderWeekTable() {
      const table = document.querySelector(".week-table");
      table.innerHTML = ""; // clear existing rows
      const thead = document.createElement("thead");
      const tbody = document.createElement("tbody");
      tbody.innerHTML = "";
  
      // Calculate the start of the week (Monday)
      const startOfWeek = new Date(currentDate);
      const diff = (startOfWeek.getDay() + 6) % 7; // Adjust for Monday as the first day
      startOfWeek.setDate(currentDate.getDate() - diff);
  
      // Use `todayDate` for "today"
      console.log("Today's date (for testing):", todayDate.toDateString()); // Debugging log
  
      // Create the header row with weekdays and dates
      const headerRow = document.createElement("tr");
      const timeHeader = document.createElement("th");
      timeHeader.className = "time-column";
      timeHeader.innerHTML = '<span class="sr-only">Time</span>';
      headerRow.appendChild(timeHeader);
      thead.appendChild(headerRow);
      table.appendChild(thead);
  
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + i);
  
        const dayName = dayDate.toLocaleDateString("en-US", { weekday: "short" }); // e.g., "Mon"
        const dayNumber = dayDate.getDate(); // e.g., 4
  
        const th = document.createElement("th");
  
        // Wrap the date number in a <span> for styling
        th.innerHTML = `${dayName} <span class="today-date-number">${dayNumber}</span>`;
  
        // Add the "today" class if the day matches `todayDate`
        if (
          dayDate.getDate() === todayDate.getDate() &&
          dayDate.getMonth() === todayDate.getMonth() &&
          dayDate.getFullYear() === todayDate.getFullYear()
        ) {
          console.log("Today matched:", dayDate.toDateString()); // Debugging log
          th.classList.add("today");
        }
  
        headerRow.appendChild(th);
      }
  
      tbody.appendChild(headerRow);
  
      // Create the time rows
      for (let h = 8; h < 25; h++) {
        const row = document.createElement("tr");
        const timeCell = document.createElement("td");
        timeCell.className = "time-column";
        const displayHour = (h % 24).toString().padStart(2, "0");
        timeCell.textContent = `${displayHour}:00`;
        row.appendChild(timeCell);
  
        for (let dow = 0; dow < 7; dow++) {
          const cell = document.createElement("td");
          if (dow >= 5) cell.classList.add("weekend");
          row.appendChild(cell);
        }
        tbody.appendChild(row);
      }
      table.appendChild(tbody);
    }
  
    function renderDayTable() {
      const tbody = document.querySelector(".day-table tbody");
      tbody.innerHTML = "";
    
      for (let h = 8; h < 25; h++) {
        const row = document.createElement("tr");
    
        // 1) Time‐label cell (only appended once)
        const timeCell = document.createElement("td");
        timeCell.className = "time-column";
        const displayHour = h === 24 ? '00' : String(h).padStart(2, '0');
        timeCell.textContent = `${displayHour}:00`;
        row.appendChild(timeCell);
    
        // 2) Exactly ONE event‐container cell
        const eventCell = document.createElement("td");
        eventCell.className = "day-column";
        eventCell.style.position = "relative";
        row.appendChild(eventCell);
    
        tbody.appendChild(row);
      }
    }
  
    // ───────────────────────────────────────────────────────────
    // Place events into month/week/day
    // ───────────────────────────────────────────────────────────
    function renderEvents() {
      const events = generateEvents();
      document.querySelectorAll('.calendar-event, .more-events')
              .forEach(el => el.remove());
  
      const SLOT_HT = 50;
  
      // ── MONTH: up to 2 events + “+N more” ─────────────────────
      if (currentView === 'month') {
        const MAX_SHOW = 2;
        document.querySelectorAll('.month-table td').forEach(td => {
          const span = td.querySelector('.date-num');
          if (!span?.textContent) return;
  
          const day = +span.textContent;
          const cellDate = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          );
          const todays = events.filter(e => {
            const sd = new Date(e.start);
            return sd.getFullYear()===cellDate.getFullYear()
                && sd.getMonth()   ===cellDate.getMonth()
                && sd.getDate()    ===cellDate.getDate();
          });
  
          todays.slice(0, MAX_SHOW).forEach(ev => td.appendChild(createEventElement(ev)));
  
          if (todays.length > MAX_SHOW) {
            const moreCount = todays.length - MAX_SHOW;
            const link = document.createElement('a');
            link.href       = '#';
            link.className  = 'calendar-event more-events';
            link.setAttribute('role','button');
            link.setAttribute('tabindex','0');
            link.textContent = `+${moreCount} more`;
            link.setAttribute(
              'aria-label',
              `${moreCount} more events on ${cellDate.toLocaleDateString()}`
            );
            link.addEventListener('click', e => {
              e.preventDefault();
              currentDate = cellDate;
              switchView('day');
            });
            link.addEventListener('keydown', e => {
              if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                link.click();
              }
            });
            td.appendChild(link);
          }
        });
      }
  
      // ── WEEK: one‐hour‐before deadlines & side‐by‐side ─────────
      if (currentView === 'week') {
        // compute week range
        const diff      = (currentDate.getDay() + 6) % 7;
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - diff);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd   = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        // group into cells
        const cellMap = {};
        events.forEach(ev => {
          const sd0 = new Date(ev.start);
          if (sd0 < weekStart || sd0 > weekEnd) return;
          
          const ed = new Date(ev.end);
          // ─── Treat midnight‐only deadlines as “end of day D” ───
          if ((ev.category==='deregistration-deadline' ||
              ev.category==='registration-deadline')
              && ed.getHours() === 0
              && ed.getMinutes() === 0
              && ed.getSeconds() === 0) {
            // move the deadline forward to the *next* midnight
            // so that subtracting one hour puts us at 23:00 on D
            ed.setDate(ed.getDate() + 1);
          }

          // for deadlines, shift start to one hour before end
          const sd = (ev.category==='deregistration-deadline' ||
                           ev.category==='registration-deadline')
                         ? new Date(ed.getTime() - 60*60*1000)
                        : sd0;

          const rowIdx = sd.getHours() - 8;
          const colIdx = (sd.getDay() + 6) % 7 + 1;
          const key    = `${rowIdx}-${colIdx}`;
          (cellMap[key] ||= []).push({ ev, sd, ed });
        });

        // render each cell’s events side-by-side
        Object.entries(cellMap).forEach(([key, list]) => {
          const [rowIdx, colIdx] = key.split('-').map(Number);
          const rows = document.querySelectorAll('.week-table tbody tr');
          // **FIXED**: skip header row by adding +1
          const cell = rows[rowIdx + 1]?.children[colIdx];
          if (!cell) return;
          cell.style.position = 'relative';

          const count = list.length;
          list.forEach((obj, i) => {
            const { ev, sd, ed } = obj;
            const durH   = (ed - sd) / (1000 * 60 * 60);
            const offset = (sd.getMinutes() / 60) * SLOT_HT;

            const evEl = createEventElement(ev);
            evEl.style.position = 'absolute';
            evEl.style.top    = `${offset}px`;
            evEl.style.width  = `calc(${100/count}%)`;
            evEl.style.left   = `calc(${i*(100/count)}% + ${4*i}px)`;
            evEl.style.height = `${durH * SLOT_HT}px`;

            cell.appendChild(evEl);
          });
        });
      }
      
      if (currentView === 'day') {
        const todayStr = currentDate.toDateString();
        const SLOT_HT  = 50;
        const rows     = document.querySelectorAll(".day-table tbody tr");
      
        const dayEventsWithTimes = events
          .map(ev => {
            const sd0 = new Date(ev.start);
            const ed0 = new Date(ev.end);
            let   sd  = new Date(sd0);
            let   ed  = new Date(ed0);
      
            if (ev.category === 'registration-deadline' ||
                ev.category === 'deregistration-deadline') {
              const startOfDay = new Date(ed);
              startOfDay.setHours(8, 0, 0, 0);
      
              const matchingExam = [...getAvailableExams(), ...getRegisteredExams()].find(e => {
                return (e.registrationDeadline?.toISOString() === ed.toISOString() ||
                        e.deregistrationDeadline?.toISOString() === ed.toISOString());
              });
      
              if (ev.category === 'registration-deadline') {
                sd = matchingExam?.registrationStart ?? startOfDay;
              } else {
                sd = startOfDay;
              }
      
              if (sd < startOfDay) sd = startOfDay;
      
              // Fix case where deadline is at 00:00 (treat as full-day ending at 23:59)
              if (ed.getHours() === 0 && ed.getMinutes() === 0 && ed.getSeconds() === 0) {
                ed.setDate(ed.getDate());
                ed.setHours(23, 59, 0, 0);
              }
            }
      
            return { ev, sd, ed };
          })
          .filter(({ ev, sd }) => {
            if (ev.category === 'registration-deadline' ||
                ev.category === 'deregistration-deadline') {
              return new Date(ev.end).toDateString() === todayStr;
            }
            return sd.toDateString() === todayStr;
          })
          .sort((a, b) => a.sd - b.sd);
      
        if (!dayEventsWithTimes.length) return;
      
        const columns = dayEventsWithTimes.map(item => [ item ]);
      
        columns.forEach((col, colIdx) => {
          const pct = 100 / columns.length;
          col.forEach(({ ev, sd, ed }) => {
            const el = createEventElement(ev);
            el.style.position = "absolute";
      
            let rowIdx = sd.getHours() - 8;
            if (rowIdx < 0) rowIdx = 0;
      
            const topOffset = (sd.getMinutes() / 60) * SLOT_HT;
            const durH = (ed - sd) / (1000 * 60 * 60);
            el.style.top    = `${topOffset}px`;
            el.style.height = `${durH * SLOT_HT}px`;
      
            el.style.left   = `calc(${colIdx * pct}% )`;
            el.style.width  = `calc(${pct}% )`;
      
            rows[rowIdx].children[1].appendChild(el);
          });
        });
      }
      
      
      
    }
    // ───────────────────────────────────────────────────────────
    // view–switching & prev/next
    // ───────────────────────────────────────────────────────────
    function switchView(view) {
      currentView = view;
      for (let k in views) {
        views[k].style.display      = (k === view ? 'block' : 'none');
        views[k].setAttribute('aria-hidden', k !== view);
      }
      viewButtons.forEach(b => b.setAttribute(
        'aria-pressed',
        b.dataset.view === view
      ));
      updateCalendarHeader();
      if (view === 'month') renderMonthTable();
      if (view === 'week')  renderWeekTable();
      if (view === 'day')   renderDayTable();
      renderEvents();
    }
  
    // Prev button
    document.querySelector('.prev-btn').addEventListener('click', () => {
      if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() - 1);
      } else if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() - 7);
      } else if (currentView === 'day') {
        currentDate.setDate(currentDate.getDate() - 1);
      }
      switchView(currentView);
    });
  
    // Next button
    document.querySelector('.next-btn').addEventListener('click', () => {
      if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (currentView === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
      }
      switchView(currentView);
    });
    viewButtons.forEach(btn => btn.addEventListener('click', () => {
      switchView(btn.dataset.view);
    }));
  
    // initial
    updateCalendarHeader();
    switchView(currentView);
  }
  export function renderCalendar() {
    const container = document.getElementById('calendar-events');
    container.innerHTML = '';
    getRegisteredExams().forEach(e => {
      const div = document.createElement('div');
      div.className = 'calendar-event';
      div.textContent = 
        `${e.title}: ${e.examStart.toLocaleString()} – ${e.examEnd.toLocaleString()}`;
      container.appendChild(div);
    });
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    renderCalendar();
    window.addEventListener('app:update', renderCalendar);
  });
  
  /**
   * Parse “DD/MM/YYYY” or “DD/MM/YYYY at HH:MM” into a JS Date.
   */
  function parseCustomDateTime(str) {
    // split off optional time
    const [datePart, timePart] = str.split(' at ');
    const [d, m, y]            = datePart.split('/').map(Number);
    // default to midnight if no time
    let hh = 0, mm = 0;
    if (timePart) {
      [hh, mm] = timePart.split(':').map(Number);
    }
    // month is zero-based
    return new Date(y, m - 1, d, hh, mm);
  }