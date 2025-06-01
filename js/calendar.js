// Use examService for dynamic events
import { getRegisteredExams, getAvailableExams } from './examService.js';
function formatOrdinalDay(date) {
  const d = date.getDate();
  const suffix = (d % 10 === 1 && d !== 11) ? 'st' :
                (d % 10 === 2 && d !== 12) ? 'nd' :
                (d % 10 === 3 && d !== 13) ? 'rd' : 'th';
  return `${d}${suffix}`;
}

function focusFirstEvent() {
  // 1) Normalize the fixed todayDate (“2024-11-01”) to midnight
  const today = new Date(todayDate);
  today.setHours(0,0,0,0);

  // 2) Grab all tabbable events
  const allEvents = Array.from(
    document.querySelectorAll('.calendar-event[tabindex]')
  );

  // 3) Keep only those whose data-date ≥ today
  const upcoming = allEvents.filter(el => {
    const d = new Date(el.getAttribute('data-date'));
    d.setHours(0,0,0,0);
    return d >= today;
  });

  // 4) Focus the 1st future/today event, or else the very first
  const target = upcoming[0] || allEvents[0];
  if (target) target.focus();
}

//Format full week range for aria-label
function formatWeekRangeForAria(start, end) {
  const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
  const year = end.getFullYear(); // Always use end's year

  if (start.getMonth() === end.getMonth()) {
    return `from ${startMonth} ${formatOrdinalDay(start)} to ${formatOrdinalDay(end)}, ${year}`;
  } else {
    return `from ${startMonth} ${formatOrdinalDay(start)} to ${endMonth} ${formatOrdinalDay(end)}, ${year}`;
  }
}
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
      // 1) split the title into label + course
      const idx        = event.title.indexOf(':');
      const labelText  = idx >= 0 ? event.title.slice(0, idx + 1) : '';
      const courseText = idx >= 0 ? event.title.slice(idx + 1).trim() : event.title;

      // 2) build the <a> exactly as before
      const a = document.createElement('a');
      if (event.category === 'exam-date' || event.category === 'deregistration-deadline') {
        a.href = 'MyExams.html';
      } else {
        a.href = 'ExamRegistration.html';
      }
      a.className = `calendar-event ${event.category}`;
      a.setAttribute('tabindex', 0);

      // 3) figure out the true window for deadlines
      const rawStart = new Date(event.start);
      const rawEnd   = new Date(event.end);
      let displayStart = new Date(rawStart);
      let displayEnd   = new Date(rawEnd);

      if (event.category === 'registration-deadline' ||
          event.category === 'deregistration-deadline') {

        if (currentView === 'week') {
          // ── WEEK VIEW: treat a midnight‐only end as "next day at 00:00"
          if (displayEnd.getHours() === 0 &&
              displayEnd.getMinutes() === 0 &&
              displayEnd.getSeconds() === 0) {
            displayEnd = new Date(displayEnd.getTime() + 24 * 60*60*1000);
          }
          // then window = one hour before that
          displayStart = new Date(displayEnd.getTime() - 60*60*1000);

        } else if (currentView === 'day') {
          // ── DAY VIEW: pull the registrationStart if it exists,
          // or else default to 08:00; for deregistration, 08:00 always
          const allExams = [
            ...getAvailableExams({ onlyActive: false }),
            ...getRegisteredExams()
          ];
          const match = allExams.find(e =>
            e.registrationDeadline?.toISOString() === rawEnd.toISOString() ||
            e.deregistrationDeadline?.toISOString() === rawEnd.toISOString()
          );

          // start‐of‐day anchor at 08:00
          const startOfDay = new Date(rawEnd);
          startOfDay.setHours(8, 0, 0, 0);

          if (event.category === 'registration-deadline') {
            displayStart = match?.registrationStart
              ? new Date(match.registrationStart)
              : startOfDay;
          } else {
            displayStart = startOfDay;
          }

          // if the deadline is at midnight, treat end as 23:59 of that day
          if (displayEnd.getHours() === 0 &&
              displayEnd.getMinutes() === 0 &&
              displayEnd.getSeconds() === 0) {
            displayEnd = new Date(rawEnd);
            displayEnd.setHours(23, 59, 0, 0);
          }
        }
      }

      // 4) format for SR
      const startTime = displayStart.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      });
      const endTime = displayEnd.toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit'
      });

      if (currentView === 'week') {
        if (event.category === 'registration-deadline' || event.category === 'deregistration-deadline') {
          a.setAttribute(
            'aria-label',
            `${labelText.replace(':', '').toLowerCase()} ${courseText} at ${endTime}`
          );
        } else {
          a.setAttribute(
            'aria-label',
            `${labelText} ${courseText}, from ${startTime} to ${endTime}`
          );
        }
      } else if (currentView === 'day') {
        a.setAttribute(
          'aria-label',
          `${labelText} ${courseText}, from ${startTime} to ${endTime}`
        );
      } else {
        a.setAttribute(
          'aria-label',
          `${labelText} ${courseText}`
        );
      }


      // 5) keep the visual card free of times
      a.innerHTML = `
        <span class="event-label">${labelText}</span>
        <span class="event-title">${courseText}</span>
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
      const srHeader = document.querySelector('.calendar-current-sr');

      if (currentView === 'month') {
        const visualText = currentDate.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });

        calendarHeader.textContent = visualText;
        if (srHeader) {
          srHeader.textContent = visualText;
        }

      } else if (currentView === 'week') {
        const start = new Date(currentDate);
        const diff = (start.getDay() + 6) % 7;
        start.setDate(currentDate.getDate() - diff);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const isSameMonth = start.getMonth() === end.getMonth();

        const visualText = isSameMonth
          ? `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${end.getDate()}, ${end.getFullYear()}`
          : `${start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

        const screenReaderText = isSameMonth
          ? `Week of ${start.toLocaleDateString('en-US', { month: 'long' })} ${formatOrdinalDay(start)} to ${formatOrdinalDay(end)}, ${end.getFullYear()}`
          : `Week of ${start.toLocaleDateString('en-US', { month: 'long' })} ${formatOrdinalDay(start)} to ${end.toLocaleDateString('en-US', { month: 'long' })} ${formatOrdinalDay(end)}, ${end.getFullYear()}`;

        calendarHeader.textContent = visualText;
        if (srHeader) {
          srHeader.textContent = screenReaderText;
        }

      } else {
        const visualText = currentDate.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric'
        });

        const screenReaderText = currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });

        calendarHeader.textContent = `${visualText}, ${currentDate.toLocaleDateString('en-US', { weekday: 'long' })}`;
        if (srHeader) {
          srHeader.textContent = screenReaderText;
        }
      }

      // Update next/previous buttons' aria-labels
      const nextBtn = document.querySelector('.next-btn');
      const prevBtn = document.querySelector('.prev-btn');

      if (currentView === 'month') {
        const nextMonth = getNextMonthString(currentDate);
        const prevMonth = getPrevMonthString(currentDate);
        nextBtn.setAttribute('aria-label', `Next month, ${nextMonth}`);
        prevBtn.setAttribute('aria-label', `Previous month, ${prevMonth}`);
      } else if (currentView === 'week') {
        nextBtn.setAttribute('aria-label', `Next week, ${getNextWeekRangeString(currentDate)}`);
        prevBtn.setAttribute('aria-label', `Previous week, ${getPrevWeekRangeString(currentDate)}`);
      } else {
        nextBtn.setAttribute('aria-label', `Next day, ${getNextDayString(currentDate)}`);
        prevBtn.setAttribute('aria-label', `Previous day, ${getPrevDayString(currentDate)}`);
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
      reorderTabbing(); // ✅ Ensure it's called here AFTER rendering events
    }
    function reorderTabbing() {
      // Only run in week‐view (when the .week-table exists)
      const table = document.querySelector('.week-table');
      if (!table) return;

      let tabIndex = 1;

      // 1) Give each view-toggle (Month → Week → Day) the first tabindex values
      document.querySelectorAll('.view-toggle').forEach((btn) => {
        btn.setAttribute('tabindex', String(tabIndex++));
      });

      // 2) Then give “Prev” ↔︎ “Next” their tabindexes
      const prevBtn = document.querySelector('.prev-btn');
      const nextBtn = document.querySelector('.next-btn');
      if (prevBtn) prevBtn.setAttribute('tabindex', String(tabIndex++));
      if (nextBtn) nextBtn.setAttribute('tabindex', String(tabIndex++));

      // 3) Now walk the week‐table columns (Mon → Tue → … → Sun) and number each event
      const rows = Array.from(table.querySelectorAll('tbody tr')).slice(1);
      const matrix = Array(7).fill(null).map(() => []);
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, colIdx) => {
          if (colIdx > 0) {
            // colIdx=0 is the time label column; shift 1–7 → 0–6
            matrix[colIdx - 1].push(cell);
          }
        });
      });

      matrix.forEach((colCells) => {
        colCells.forEach((cell) => {
          // “[tabindex]” finds exactly those <a> links you created, since they all start with tabindex="0"
          const links = cell.querySelectorAll('[tabindex]');
          links.forEach((link) => {
            link.setAttribute('tabindex', String(tabIndex++));
          });
        });
      });

      // 4) Finally, strip the hidden “skip to first event” anchor out of the tab flow
      const skipAnchor = document.getElementById('calendar-focus-anchor');
      if (skipAnchor) {
        skipAnchor.setAttribute('tabindex', '-1');
      }
    }

    /**
     * Removes any positive tabindex attributes that reorderTabbing() applied in week view.
     * After calling this, view-toggles, Prev/Next, and leftover week-event links
     * will return to their default tab behavior.
     */
    function resetTabbing() {
      // 1) Remove explicit tabindex from the three .view-toggle buttons:
      document.querySelectorAll('.view-toggle').forEach(btn => {
        btn.removeAttribute('tabindex');
      });

      // 2) Remove explicit tabindex from .prev-btn and .next-btn:
      const prevBtn = document.querySelector('.prev-btn');
      const nextBtn = document.querySelector('.next-btn');
      if (prevBtn) prevBtn.removeAttribute('tabindex');
      if (nextBtn) nextBtn.removeAttribute('tabindex');

      // 3) (Optional cleanup) Any event links that remain in .week-table:
      //    reset them back to tabindex="0" so they behave normally in month/day.
      document.querySelectorAll('.week-table [tabindex]').forEach(el => {
        el.setAttribute('tabindex', '0');
      });
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
              `${moreCount} more events for ${cellDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}`
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
        views[k].style.display = (k === view ? 'block' : 'none');
        views[k].setAttribute('aria-hidden', k !== view);
      }

      viewButtons.forEach(b =>
        b.setAttribute('aria-pressed', b.dataset.view === view)
      );

      updateCalendarHeader();

      if (view === 'month') {
        renderMonthTable();
      }

      if (view === 'week') {
        renderWeekTable();
        resetTabbing();
      }

      if (view === 'day') {
        renderDayTable();
        resetTabbing();
      }

      renderEvents();

      if (view === 'week') {
        reorderTabbing();
        focusFirstEvent(); 
      }
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
  

  function getNextMonthString(date) {
  const next = new Date(date);
  next.setMonth(date.getMonth() + 1);
  return next.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getPrevMonthString(date) {
  const prev = new Date(date);
  prev.setMonth(date.getMonth() - 1);
  return prev.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function getNextWeekRangeString(date) {
  const nextStart = new Date(date);
  nextStart.setDate(date.getDate() + 7);
  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextStart.getDate() + 6);
  return formatWeekRangeForAria(nextStart, nextEnd);
}

function getPrevWeekRangeString(date) {
  const prevStart = new Date(date);
  prevStart.setDate(date.getDate() - 7);
  const prevEnd = new Date(prevStart);
  prevEnd.setDate(prevStart.getDate() + 6);
  return formatWeekRangeForAria(prevStart, prevEnd);
}



function getNextDayString(date) {
  const next = new Date(date);
  next.setDate(date.getDate() + 1);
  return next.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function getPrevDayString(date) {
  const prev = new Date(date);
  prev.setDate(date.getDate() - 1);
  return prev.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}


