const API_URL = '/api/events';

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

// Form Inputs
const eventIdInput = document.getElementById('eventId');
const titleInput = document.getElementById('title');
const categoryInput = document.getElementById('category');
const completedInput = document.getElementById('completed');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const descriptionInput = document.getElementById('description');

let allEvents = [];

// Initialize
document.addEventListener('DOMContentLoaded', fetchEvents);

// Event Listeners
openModalBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
eventModal.addEventListener('click', (e) => {
  if (e.target === eventModal) closeModal();
});
eventForm.addEventListener('submit', handleFormSubmit);
categoryFilter.addEventListener('change', renderEvents);

// 1. GET ALL EVENTS
async function fetchEvents() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to load events');
    allEvents = await res.json();
    renderEvents();
  } catch (err) {
    console.error(err);
  }
}

// 2. RENDER EVENTS
function renderEvents() {
  const selectedCat = categoryFilter.value;
  const filtered = selectedCat === 'ALL' 
    ? allEvents 
    : allEvents.filter(e => (e.category || '').toLowerCase() === selectedCat.toLowerCase());

  eventsContainer.innerHTML = '';
  statsCount.textContent = `${filtered.length} Event${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  filtered.forEach(event => {
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

// 3. CREATE OR UPDATE EVENT
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
    if (id) {
      // PUT (Update)
      await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      // POST (Create)
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    closeModal();
    fetchEvents();
  } catch (err) {
    console.error('Save failed:', err);
  }
}

// 4. TOGGLE STATUS
async function toggleStatus(id) {
  const event = allEvents.find(e => e.id === id);
  if (!event) return;

  const updated = { ...event, completed: !event.completed };
  await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated)
  });
  fetchEvents();
}

// 5. DELETE EVENT
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
    // Default start time to now
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