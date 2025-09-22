/*******************************
 * Calendar Lab — script.js (with extra credit editing)
 *******************************/

/** Global store of events (array of JSON objects). */
const events = [];

/** Track which event is being edited (null = creating new). */
let editIndex = null;

/** Tiny helper */
function $(id) { return document.getElementById(id); }

/**
 * Show Location when modality is "in-person"; show Remote URL when "remote".
 * Also toggle `required` appropriately. Called via onchange on the select.
 */
function updateLocationOptions(passedValue) {
  const modality = passedValue || ($('event_modality') ? $('event_modality').value : '');

  const inGroup  = $('in_person_group');
  const remGroup = $('remote_group');
  const locInp   = $('event_location');
  const urlInp   = $('event_remote_url');

  if (inGroup)  inGroup.style.display  = (modality === 'in-person') ? '' : 'none';
  if (remGroup) remGroup.style.display = (modality === 'remote')    ? '' : 'none';

  if (locInp) locInp.required = (modality === 'in-person');
  if (urlInp) urlInp.required = (modality === 'remote');
}

// Initialize visibility on first load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => updateLocationOptions());
} else {
  updateLocationOptions();
}

/**
 * Read form values, push/update in `events`, log to console,
 * re-render calendar, then reset the form.
 */
function saveEvent() {
  const nameEl   = $('event_name');
  const dayEl    = $('event_weekday');
  const timeEl   = $('event_time');
  const modEl    = $('event_modality');
  const catEl    = $('event_category');
  const locEl    = $('event_location');
  const urlEl    = $('event_remote_url');
  const attEl    = $('event_attendees');
  const form     = $('event_form');

  // Use browser validation (required + pattern, including URL pattern)
  if (form && !form.reportValidity()) return;

  const modality = modEl.value;

  const eventDetails = {
    name:      (nameEl.value || '').trim(),
    weekday:   dayEl.value,
    time:      timeEl.value,
    modality:  modality,                   // "in-person" | "remote"
    category:  catEl.value || 'other',
    location:  (modality === 'in-person') ? ((locEl.value || '').trim()) : null,
    remote_url:(modality === 'remote')    ? ((urlEl.value || '').trim()) : null,
    attendees: (attEl.value || '').trim()
  };

  if (editIndex === null) {
    // Create
    events.push(eventDetails);
  } else {
    // Update
    events[editIndex] = eventDetails;
  }

  console.log('events:', events);

  // Re-render everything (simple and robust when weekday changes)
  renderCalendar();

  // Reset form & state
  form.reset();
  updateLocationOptions();
  editIndex = null;

  // Close modal (optional but nice)
  const modalEl = $('event_modal');
  if (modalEl) {
    const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    modal.hide();
  }
}

/**
 * EXTRA CREDIT: open existing event for editing.
 * Prefills the modal and sets editIndex.
 */
function openEditEvent(index) {
  const ev = events[index];
  if (!ev) return;
  editIndex = index;

  $('event_name').value     = ev.name || '';
  $('event_weekday').value  = ev.weekday || '';
  $('event_time').value     = ev.time || '';
  $('event_modality').value = ev.modality || '';
  $('event_category').value = ev.category || 'other';

  updateLocationOptions(ev.modality);
  if (ev.modality === 'in-person') {
    $('event_location').value = ev.location || '';
    $('event_remote_url').value = '';
  } else {
    $('event_remote_url').value = ev.remote_url || '';
    $('event_location').value = '';
  }
  $('event_attendees').value = ev.attendees || '';

  const modalEl = $('event_modal');
  const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.show();
}

/** Render a single event card into the correct weekday column. */
function addEventToCalendarUI(eventInfo, indexInArray) {
  const dayId = String(eventInfo.weekday).toLowerCase();
  const dayCol = $(dayId);
  if (!dayCol) return;

  const card = createEventCard(eventInfo, indexInArray);
  dayCol.appendChild(card);
}

/** Minimal Bootstrap-looking card (plus light category color) + click-to-edit. */
function createEventCard(eventDetails, indexInArray) {
  const div = document.createElement('div');
  div.className = `event row border rounded m-1 py-1 ${categoryToClass(eventDetails.category)}`;
  div.dataset.index = indexInArray;

  const info = document.createElement('div');
  info.className = 'col-12 small';

  const prettyTime = eventDetails.time || '--:--';
  const modalityLabel = (eventDetails.modality === 'in-person') ? 'In-Person'
                        : (eventDetails.modality === 'remote')  ? 'Remote' : '—';

  info.innerHTML = `
    <div><strong>Event Name:</strong> ${eventDetails.name || '(Untitled Event)'}</div>
    <div><strong>Event Time:</strong> ${prettyTime}</div>
    <div><strong>Event Modality:</strong> ${modalityLabel}</div>
    ${
      eventDetails.modality === 'in-person'
        ? `<div><strong>Location:</strong> ${eventDetails.location || '—'}</div>`
        : `<div><strong>Remote URL:</strong> ${eventDetails.remote_url
              ? `<a href="${eventDetails.remote_url}" target="_blank" rel="noopener">Join</a>` : '—'}</div>`
    }
    <div><strong>Attendees:</strong> ${eventDetails.attendees || '—'}</div>
  `;

  // EXTRA CREDIT: clicking a card opens it for editing
  div.addEventListener('click', () => openEditEvent(indexInArray));

  div.appendChild(info);
  return div;
}

/** Minimal mapper for Part C colors */
function categoryToClass(cat) {
  switch ((cat || '').toLowerCase()) {
    case 'academic': return 'event-cat-academic';
    case 'work':     return 'event-cat-work';
    case 'personal': return 'event-cat-personal';
    default:         return 'event-cat-other';
  }
}

/** Clear all day columns (keep headers) and re-add all events. */
function renderCalendar() {
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  days.forEach(id => {
    const col = $(id);
    if (!col) return;
    // preserve the first child (the day header)
    while (col.children.length > 1) col.removeChild(col.lastElementChild);
  });
  events.forEach((e, i) => addEventToCalendarUI(e, i));
}
