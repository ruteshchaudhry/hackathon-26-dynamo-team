import { config } from './config.js';
import { createDemoStore, targets, roles, validate } from './demo-store.mjs';
const $ = id => document.getElementById(id);
const store = createDemoStore(localStorage);
let active = null, selected = new Set(), view = 'review', session = false;
const label = row => targets.find(item => item.id === row.targetId)?.label || 'Property needed';
const node = (tag, text, className) => { const el = document.createElement(tag); el.textContent = text; if (className) el.className = className; return el; };
const feedback = (text, error = false) => { $('feedback').textContent = text; $('feedback').className = error ? 'error' : 'success'; };
function run(action) { try { return action(); } catch (error) { feedback(error.message, true); } }
function updateSelected() { $('approve-selected').disabled = selected.size === 0; $('approve-selected').textContent = selected.size ? `Approve selected (${selected.size})` : 'Approve selected'; }
function render() {
  const state = store.read();
  view = location.hash === '#/added' ? 'added' : 'review';
  selected = new Set([...selected].filter(id => state.pending.some(row => row.id === id)));
  const added = view === 'added';
  $('review-nav').toggleAttribute('aria-current', !added); $('added-nav').toggleAttribute('aria-current', added);
  if (!added) $('review-nav').setAttribute('aria-current', 'page'); else $('added-nav').setAttribute('aria-current', 'page');
  $('page-title').textContent = added ? 'Added contacts' : 'Pending review';
  $('page-description').textContent = added ? 'Your approved demo contacts.' : 'Check the details. Approve the contacts that belong.';
  $('list-title').textContent = added ? 'Approved demo records' : 'Contact suggestions';
  $('pending-count').textContent = $('nav-count').textContent = state.pending.length;
  $('added-count').textContent = state.added.length;
  $('incomplete-count').textContent = state.pending.filter(row => { try { validate(row); return false; } catch { return true; } }).length;
  $('approve-selected').hidden = added;
  $('scan').hidden = added;
  $('table-head').replaceChildren(...(added ? ['Contact', 'Property & relationship', 'Demo outcome', 'Approved'] : ['', 'Contact', 'Property & relationship', 'Suggestion', '']).map(text => node('th', text)));
  if (!added) $('table-head').firstChild.append(node('span', 'Select', 'sr-only'));
  const query = $('search').value.trim().toLowerCase();
  const rows = (added ? state.added : state.pending).filter(row => `${row.email} ${row.firstName} ${row.lastName} ${label(row)} ${row.role}`.toLowerCase().includes(query));
  $('rows').replaceChildren();
  for (const row of rows) {
    const tr = document.createElement('tr');
    if (!added) {
      const td = document.createElement('td'), box = document.createElement('input'); box.type = 'checkbox'; box.checked = selected.has(row.id); box.setAttribute('aria-label', `Select ${row.email}`);
      box.addEventListener('change', () => { if (box.checked) selected.add(row.id); else selected.delete(row.id); updateSelected(); }); td.append(box); tr.append(td);
    }
    const contact = document.createElement('td'); contact.append(node('strong', [row.firstName, row.lastName].filter(Boolean).join(' ') || 'Name not provided'), node('small', row.email));
    const target = document.createElement('td'); target.append(node('strong', label(row)), node('small', row.role || 'Relationship needed')); tr.append(contact, target);
    const status = document.createElement('td');
    let valid = true; try { validate(row); } catch { valid = false; }
    status.append(node('span', added ? 'Contact saved' : (!valid ? 'Needs your input' : row.match), !valid ? 'tag warning' : 'tag'));
    tr.append(status);
    const action = document.createElement('td');
    if (added) action.append(node('small', new Date(row.approvedAt).toLocaleString()));
    else { const button = node('button', 'Review', 'review-button'); button.addEventListener('click', () => openReview(row)); action.append(button); }
    tr.append(action); $('rows').append(tr);
  }
  $('empty').hidden = rows.length !== 0;
  $('empty-title').textContent = query ? 'No matching contacts' : added ? 'No approved contacts yet' : "You're all caught up";
  $('empty-description').textContent = query ? 'Try another name, email or property.' : added ? 'Approved demo records will appear here.' : 'Scan the sample inbox to look for more suggestions.';
  updateSelected();
}
function openReview(row) {
  active = { ...row }; const form = $('review-form');
  for (const key of ['email','firstName','lastName','targetId','role']) form.elements.namedItem(key).value = row[key];
  $('source-subject').textContent = row.subject; $('source-excerpt').textContent = row.excerpt; $('form-error').textContent = '';
  $('review-dialog').showModal();
}
for (const [field, items] of [['targetId', targets.map(t => [t.id,t.label])], ['role', roles.map(r => [r,r])]]) {
  const select = $('review-form').elements.namedItem(field); select.add(new Option('Choose…', ''));
  for (const [value, text] of items) select.add(new Option(text, value));
}
$('review-form').addEventListener('submit', event => {
  event.preventDefault(); $('form-error').textContent = '';
  try {
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    if (event.submitter?.value === 'approve') validate(fields);
    const saved = store.save(active.id, active.version, fields); active = saved;
    if (event.submitter?.value === 'approve') { store.approve(saved.id, saved.version); feedback('Added to demo contacts. No Dynamics records were changed.'); }
    else feedback('Changes saved for later review.');
    $('review-dialog').close(); render();
  } catch (error) { $('form-error').textContent = error.message; }
});
$('close-dialog').addEventListener('click', () => $('review-dialog').close());
$('enter').addEventListener('click', () => run(() => { if (config.mode !== 'demo') throw new Error('Live integration is not configured yet.'); render(); session = true; $('welcome').hidden = true; $('workspace').hidden = false; }));
$('leave').addEventListener('click', () => { session = false; $('workspace').hidden = true; $('welcome').hidden = false; });
$('search').addEventListener('input', () => run(render));
window.addEventListener('hashchange', () => run(() => { selected.clear(); $('search').value = ''; feedback(''); if (session) render(); }));
window.addEventListener('storage', () => { if (session) run(render); });
$('scan').addEventListener('click', () => run(() => { const count = store.scan(); render(); feedback(`${count} new sample suggestion${count === 1 ? '' : 's'}. This scan used fictional fixtures, not Outlook or AI.`); }));
$('approve-selected').addEventListener('click', () => run(() => {
  const pending = store.read().pending; let count = 0; const errors = [];
  for (const id of selected) {
    const row = pending.find(item => item.id === id); if (!row) continue;
    try { store.approve(id, row.version); count++; } catch (error) { errors.push(`${row.email}: ${error.message}`); }
  }
  selected.clear(); render(); feedback(`${count} added to demo contacts.${errors.length ? ` ${errors.join(' ')}` : ''}`, errors.length > 0);
}));
$('reset').addEventListener('click', () => { if (confirm('Reset only this browser’s fictional demo data?')) run(() => { store.reset(); selected.clear(); render(); feedback('Sample data reset.'); }); });
