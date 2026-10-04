const API_URL = '/api/events';

// State
let allEvents = [];
let currentView = 'calendar'; // 'calendar' | 'timeline' | 'list'
let activeDate = new Date();

// DOM Elements
const eventsContainer = document.getElementById('eventsContainer');
const emptyState = document.getElementById('emptyState');
const statsCount = document.getElementById('statsCount');
const categoryFilter = document.getElementById('categoryFilter');

const eventModal = document.getElementById('eventModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const eventForm = document.getElementById('eventForm');
const modalTitle = document.getElementById('modalTitle');

const calendarView = document.getElementById('calendarView');
const timelineView = document.getElementById('timelineView');
const listView = document.getElementById('listView');
const calendarGrid = document.getElementById('calendarGrid');
const timelineHours = document.getElementById('timelineHours');
const periodLabel = document.getElementById('currentPeriodLabel');

// Form Inputs
const eventIdInput = document.getElementById('eventId');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const completedInput = document.getElementById('completed');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const descriptionInput = document.getElementById('description');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  fetchEvents();
});

function setupEventListeners() {
  openModalBtn.addEventListener('click', () => openModal());
  closeModalBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) closeModal();
  });
  
  eventForm.addEventListener('submit', handleFormSubmit);
  categoryFilter.addEventListener('change', renderCurrentView);

  // View switchers
  document.getElementById('viewGridBtn').onclick = () => switchView('calendar');
  document.getElementById('viewTimelineBtn').onclick = () => switchView('timeline');
  document.getElementById('viewListBtn').onclick = () => switchView('list');

  // Period navigation
  document.getElementById('prevPeriodBtn').onclick = () => navigatePeriod(-1);
  document.getElementById('nextPeriodBtn').onclick = () => navigatePeriod(1);
  document.getElementById('todayBtn').onclick = () => {
    activeDate = new Date();
    renderCurrentView();
  };
}

// 1. API: GET ALL EVENTS
async function fetchEvents() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to load events');
    allEvents = await res.json();
    renderCurrentView();
  } catch (err) {
    console.error('Error fetching events:', err);
  }
}

// Helper: Filter events by category
function getFilteredEvents() {
  const selectedCat = categoryFilter.value;
  return selectedCat === 'ALL'
    ? allEvents
    : allEvents.filter(e => (e.category || '').toLowerCase() === selectedCat.toLowerCase());
}

// Helper: Local Date string YYYY-MM-DD (immune to UTC timezone shift)
function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// View Switching & Navigation
function switchView(view) {
  currentView = view;
  document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  
  calendarView.classList.add('hidden');
  timelineView.classList.add('hidden');
  listView.classList.add('hidden');

  if (view === 'calendar') {
    document.getElementById('viewGridBtn').classList.add('active');
    calendarView.classList.remove('hidden');
  } else if (view === 'timeline') {
    document.getElementById('viewTimelineBtn').classList.add('active');
    timelineView.classList.remove('hidden');
  } else {
    document.getElementById('viewListBtn').classList.add('active');
    listView.classList.remove('hidden');
  }
  renderCurrentView();
}

function navigatePeriod(step) {
  if (currentView === 'calendar') {
    activeDate.setMonth(activeDate.getMonth() + step);
  } else {
    activeDate.setDate(activeDate.getDate() + step);
  }
  renderCurrentView();
}

function renderCurrentView() {
  const filtered = getFilteredEvents();
  statsCount.textContent = `${filtered.length} Event${filtered.length === 1 ? '' : 's'}`;

  if (currentView === 'calendar') {
    renderMonthCalendar(filtered);
  } else if (currentView === 'timeline') {
    renderDayTimeline(filtered);
  } else {
    renderAgendaCards(filtered);
  }
}

// 2. VIEW: MONTH GRID
function renderMonthCalendar(events) {
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  
  periodLabel.textContent = activeDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  calendarGrid.innerHTML = '';

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarGrid.appendChild(createDayCell(prevMonthTotalDays - i, true));
  }

  // Active month days
  const today = new Date();
  for (let day = 1; day <= totalDays; day++) {
    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daysEvents = events.filter(e => e.startTime && e.startTime.startsWith(cellDateStr));
    
    calendarGrid.appendChild(createDayCell(day, false, isToday, daysEvents, cellDateStr));
  }
}

function createDayCell(dayNum, isOtherMonth, isToday = false, events = [], dateStr = '') {
  const cell = document.createElement('div');
  cell.className = `calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
  
  const header = document.createElement('div');
  header.className = 'day-header';
  header.innerHTML = `<span class="day-number">${dayNum}</span>`;
  cell.appendChild(header);

  if (!isOtherMonth) {
    const eventsWrap = document.createElement('div');
    eventsWrap.className = 'day-events';

    events.forEach(event => {
      const pill = document.createElement('div');
      pill.className = `event-pill badge-${(event.category || 'personal').toLowerCase()}`;
      pill.textContent = event.title;
      pill.onclick = (e) => {
        e.stopPropagation();
        openModal(event);
      };
      eventsWrap.appendChild(pill);
    });

    cell.appendChild(eventsWrap);

    cell.onclick = () => {
      activeDate = new Date(dateStr + 'T00:00:00');
      switchView('timeline');
    };
  }

  return cell;
}

// 3. VIEW: DAY TIMELINE
function renderDayTimeline(events) {
  periodLabel.textContent = activeDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  timelineHours.innerHTML = '';

  const activeDateStr = formatLocalDate(activeDate);
  const daysEvents = events.filter(e => e.startTime && e.startTime.startsWith(activeDateStr));

  for (let hour = 7; hour <= 21; hour++) {
    const row = document.createElement('div');
    row.className = 'timeline-row';

    const hourStr = String(hour).padStart(2, '0') + ':00';
    row.innerHTML = `<div class="timeline-hour">${hourStr}</div>`;

    const slot = document.createElement('div');
    slot.className = 'timeline-slot';

    const matching = daysEvents.filter(e => {
      const eventHour = parseInt(e.startTime.slice(11, 13), 10);
      return eventHour === hour;
    });

    matching.forEach(ev => {
      const block = document.createElement('div');
      block.className = `timeline-event-block badge-${(ev.category || 'work').toLowerCase()}`;
      block.innerHTML = `<span>${escapeHtml(ev.title)}</span> <small>(${ev.startTime.slice(11, 16)} - ${ev.endTime ? ev.endTime.slice(11, 16) : 'End'})</small>`;
      block.onclick = () => openModal(ev);
      slot.appendChild(block);
    });

    row.appendChild(slot);
    timelineHours.appendChild(row);
  }
}

// 4. VIEW: AGENDA CARDS
function renderAgendaCards(events) {
  periodLabel.textContent = 'All Scheduled Events';
  eventsContainer.innerHTML = '';

  if (events.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  events.forEach(event => {
    const card = document.createElement('div');
    card.className = `event-card ${event.completed ? 'completed' : ''}`;

    const catClass = `badge-${(event.category || 'personal').toLowerCase()}`;
    const startFormatted = formatDateTime(event.startTime);
    const endFormatted = event.endTime ? ` - ${formatDateTime(event.endTime)}` : '';

    card.innerHTML = `
      <div>
        <div class="card-top">
          <span class="badge ${catClass}">${escapeHtml(event.category || 'General')}</span>
          <button class="btn btn-small secondary-btn" onclick="toggleStatus(${event.id})">
            ${event.completed ? '✓ Completed' : 'Mark Done'}
          </button>
        </div>
        <h3 class="card-title">${escapeHtml(event.title)}</h3>
        <p class="card-time">📅 ${startFormatted}${endFormatted}</p>
        <p class="card-desc">${escapeHtml(event.description || '')}</p>
      </div>
      <div class="card-actions">
        <button class="btn btn-small secondary-btn" onclick="editEvent(${event.id})">Edit</button>
        <button class="btn btn-small btn-danger" onclick="deleteEvent(${event.id})">Delete</button>
      </div>
    `;
    eventsContainer.appendChild(card);
  });
}

// 5. API: CREATE OR UPDATE EVENT
async function handleFormSubmit(e) {
  e.preventDefault();

  const id = eventIdInput.value;
  const payload = {
    title: titleInput.value.trim(),
    category: categoryInput.value,
    completed: completedInput.value === 'true',
    startTime: startTimeInput.value,
    endTime: endTimeInput.value || null,
    description: descriptionInput.value.trim()
  };

  try {
    const res = await fetch(id ? `${API_URL}/${id}` : API_URL, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert('Validation Error: ' + Object.values(errorData).join('\n'));
      return;
    }

    closeModal();
    fetchEvents();
  } catch (err) {
    console.error('Save failed:', err);
  }
}

// 6. API: TOGGLE STATUS
async function toggleStatus(id) {
  const event = allEvents.find(e => e.id === id);
  if (!event) return;

  const payload = {
    title: event.title,
    category: event.category || 'Personal',
    completed: !event.completed,
    startTime: event.startTime,
    endTime: event.endTime,
    description: event.description || ''
  };

  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  fetchEvents();
}

// 7. API: DELETE EVENT
async function deleteEvent(id) {
  if (!confirm('Are you sure you want to remove this event?')) return;
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  fetchEvents();
}

// Modal Helpers
function openModal(event = null) {
  if (event) {
    modalTitle.textContent = 'Edit Event';
    eventIdInput.value = event.id;
    titleInput.value = event.title;
    categoryInput.value = event.category || 'Work';
    completedInput.value = event.completed ? 'true' : 'false';
    startTimeInput.value = event.startTime ? event.startTime.slice(0, 16) : '';
    endTimeInput.value = event.endTime ? event.endTime.slice(0, 16) : '';
    descriptionInput.value = event.description || '';
  } else {
    modalTitle.textContent = 'New Event';
    eventForm.reset();
    eventIdInput.value = '';
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    startTimeInput.value = now.toISOString().slice(0, 16);
  }
  eventModal.classList.remove('hidden');
}

function editEvent(id) {
  const event = allEvents.find(e => e.id === id);
  if (event) openModal(event);
}

function closeModal() {
  eventModal.classList.add('hidden');
  eventForm.reset();
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Register Service Worker for PWA installation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}