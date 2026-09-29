import { config } from './config.js';
import { createSharePointStore, reviewedFields } from './sharepoint-store.mjs';
const $ = id => document.getElementById(id);
const node = (tag, text, className) => { const el = document.createElement(tag); el.textContent = text; if (className) el.className = className; return el; };
let auth, account, store, active, busy = false, signedIn = false, loaded = false;
let state = { pending: [], added: [] };
const selected = new Set();
const form = $('review-form');
const fields = { email: 'Email', firstName: 'FirstName', lastName: 'LastName', targetId: 'TargetLabel', role: 'RelationshipLabel' };
const scopes = ['https://graph.microsoft.com/Lists.SelectedOperations.Selected'];
const notify = (message, error = false) => { $('feedback').textContent = message; $('feedback').className = error ? 'error' : 'success'; };
const welcomeError = node('p', '', 'error'); welcomeError.setAttribute('role', 'alert'); $('enter').after(welcomeError);
const retryState = row => ['Processing', 'CleanupPending'].includes(row.fields.Status);
const valid = row => { try { reviewedFields(row.fields); return true; } catch { return false; } };

// This path never loads the fixture adapter or persists SharePoint records in browser storage.
document.querySelector('.notice strong').textContent = 'Shared contact review';
document.querySelector('.notice p').textContent = 'Sign in to review shared SharePoint suggestions and save approved demo contacts.';
document.querySelector('.welcome-copy > .muted').textContent = 'For authorised organisational users.';
$('enter').textContent = 'Sign in with Microsoft';
$('leave').textContent = 'Sign out'; $('scan').textContent = 'Refresh records'; $('reset').hidden = true;
document.querySelector('.mode-banner strong').textContent = 'Shared SharePoint demo';
document.querySelector('.mode-banner span').textContent = 'Approved contacts are saved in SharePoint · Dynamics is unchanged';
document.querySelector('.stats > div:last-child > span').textContent = 'Approved contacts created';
document.querySelector('footer p').textContent = 'Scans run in Power Automate. Refresh to load their suggestions. Approval saves corrected contacts in SharePoint.';
document.querySelector('#review-form > .muted').textContent = 'Save the corrected contact to SharePoint. Property and relationship descriptions are optional for this contact-only demo; Dynamics links are not validated here.';
document.querySelector('.evidence .eyebrow').textContent = 'EMAIL EVIDENCE';
for (const name of ['targetId', 'role']) {
  const input = document.createElement('input'); input.name = name; input.maxLength = 255;
  form.elements.namedItem(name).replaceWith(input);
}
function render() {
  const added = location.hash === '#/added';
  $('review-nav').removeAttribute('aria-current'); $('added-nav').removeAttribute('aria-current');
  $(added ? 'added-nav' : 'review-nav').setAttribute('aria-current', 'page');
  $('page-title').textContent = added ? 'Added contacts' : 'Pending review';
  $('page-description').textContent = added ? 'Corrected contacts approved and saved in SharePoint.' : 'Review the details, then approve to move a contact out of staging.';
  $('list-title').textContent = added ? 'Approved contacts' : 'Contact suggestions';
  $('pending-count').textContent = $('nav-count').textContent = state.pending.length;
  $('added-count').textContent = state.added.filter(row => row.fields.SimulatedContactCreated === true).length;
  $('incomplete-count').textContent = state.pending.filter(row => !valid(row)).length;
  $('approve-selected').hidden = added;
  $('approve-selected').textContent = selected.size ? `Approve selected (${selected.size})` : 'Approve selected';
  $('approve-selected').disabled = busy || !selected.size;
  $('scan').disabled = busy; $('leave').disabled = busy;
  $('table-head').replaceChildren(...(added ? ['Contact', 'Property & relationship', 'Result', 'Approved'] : ['', 'Contact', 'Property & relationship', 'Status', '']).map(text => node('th', text)));
  const query = $('search').value.trim().toLowerCase();
  const rows = (added ? state.added : state.pending).filter(({ fields: f }) => [f.Email, f.FirstName, f.LastName, f.TargetLabel, f.RelationshipLabel].join(' ').toLowerCase().includes(query));
  $('rows').replaceChildren();
  for (const row of rows) {
    const f = row.fields, tr = node('tr', '');
    if (!added) {
      const cell = node('td', ''), box = document.createElement('input'); box.type = 'checkbox'; box.checked = selected.has(row.id); box.disabled = busy;
      box.setAttribute('aria-label', `Select ${f.Email}`);
      box.addEventListener('change', () => { box.checked ? selected.add(row.id) : selected.delete(row.id); render(); }); cell.append(box); tr.append(cell);
    }
    const person = node('td', ''); person.append(node('strong', [f.FirstName, f.LastName].filter(Boolean).join(' ') || 'Name not provided'), node('small', f.Email || 'Email needed'));
    const property = node('td', ''); property.append(node('strong', f.TargetLabel || 'Not provided'), node('small', f.RelationshipLabel || 'Relationship not provided'));
    const status = node('td', ''); status.append(node('span', added ? (f.SimulatedContactCreated === true ? 'Contact saved' : 'Existing contact') : (f.Status || 'Pending'), 'tag'));
    if (!added && f.ErrorMessage) status.append(node('small', f.ErrorMessage));
    const action = node('td', '');
    if (added) action.append(node('small', f.ApprovedAt ? new Date(f.ApprovedAt).toLocaleString() : 'Not recorded'));
    else {
      const button = node('button', retryState(row) ? 'Retry approval' : 'Review', 'review-button'); button.disabled = busy;
      button.addEventListener('click', () => openReview(row)); action.append(button);
    }
    tr.append(person, property, status, action); $('rows').append(tr);
  }
  $('empty').hidden = rows.length > 0;
  $('empty-title').textContent = query ? 'No matching contacts' : added ? 'No approved contacts yet' : "You're all caught up";
  $('empty-description').textContent = query ? 'Try another name, email or property.' : added ? 'Approved SharePoint contacts will appear here.' : 'Refresh after running the sample-email flow.';
  if (!loaded) {
    for (const id of ['pending-count','nav-count','added-count','incomplete-count']) $(id).textContent = '—';
    $('empty-title').textContent = busy ? 'Loading shared records…' : 'Records are unavailable';
    $('empty-description').textContent = 'Refresh to load the lists from SharePoint.';
  }
}
async function refresh() {
  try { state = await store.read(); loaded = true; selected.clear(); render(); }
  catch (error) {
    loaded = false; state = { pending: [], added: [] }; selected.clear(); render();
    for (const id of ['pending-count','nav-count','added-count','incomplete-count']) $(id).textContent = '—';
    $('empty-title').textContent = 'Records could not be loaded'; $('empty-description').textContent = 'Refresh after resolving the connection or access issue.';
    throw error;
  }
}
async function operation(action) {
  if (busy) return;
  busy = true; render();
  try { await action(); }
  catch (error) { notify(error.message, true); }
  finally { busy = false; render(); }
}
function openReview(row) {
  active = row;
  for (const [name, field] of Object.entries(fields)) { form.elements.namedItem(name).value = row.fields[field] || ''; form.elements.namedItem(name).disabled = retryState(row); }
  form.querySelector('[value="save"]').hidden = retryState(row);
  form.querySelector('[value="approve"]').textContent = retryState(row) ? 'Retry approval' : 'Approve & add';
  $('source-subject').textContent = row.fields.Subject || 'No subject'; $('source-excerpt').textContent = row.fields.EvidenceExcerpt || 'No excerpt';
  $('form-error').textContent = ''; $('review-dialog').showModal();
}
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  const approve = event.submitter?.value === 'approve';
  busy = true; render(); form.querySelectorAll('button').forEach(button => button.disabled = true);
  try {
    if (!retryState(active)) {
      const data = Object.fromEntries(Object.entries(fields).map(([name, field]) => [field, form.elements.namedItem(name).value]));
      active = await store.save(active, data);
    }
    let message = 'Changes saved for later review.';
    if (approve) {
      const result = await store.approve(active);
      message = result.cleanupPending ? 'Contact saved in AddedContacts. Staging cleanup needs a retry; another contact will not be created.' : 'Contact saved in AddedContacts and removed from staging.';
    }
    $('review-dialog').close(); await refresh(); notify(message);
  } catch (error) {
    $('form-error').textContent = `${error.message} Close this dialog and refresh before retrying.`;
    try { await refresh(); } catch { /* Keep the original operation error visible. */ }
  } finally { busy = false; form.querySelectorAll('button').forEach(button => button.disabled = false); render(); }
});
$('close-dialog').addEventListener('click', () => $('review-dialog').close());
$('review-dialog').addEventListener('cancel', event => { if (busy) event.preventDefault(); });
$('search').addEventListener('input', render);
window.addEventListener('hashchange', () => { selected.clear(); $('search').value = ''; if (signedIn) render(); });
$('scan').addEventListener('click', () => operation(async () => { await refresh(); notify('Shared SharePoint records refreshed.'); }));
$('approve-selected').addEventListener('click', () => operation(async () => {
  const rows = state.pending.filter(row => selected.has(row.id)); let completed = 0, cleanup = 0; const errors = [];
  for (const row of rows) {
    try { const result = await store.approve(row); completed++; if (result.cleanupPending) cleanup++; }
    catch (error) { errors.push(`${row.fields.Email}: ${error.message}`); }
  }
  await refresh(); notify(`${completed} approval${completed === 1 ? '' : 's'} confirmed.${cleanup ? ` ${cleanup} staging cleanup retries needed.` : ''}${errors.length ? ` ${errors.join(' ')}` : ''}`, errors.length > 0);
}));
$('leave').addEventListener('click', async () => {
  signedIn = false; state = { pending: [], added: [] }; selected.clear(); render(); $('workspace').hidden = true; $('welcome').hidden = false;
  try { await auth.logoutRedirect({ account, postLogoutRedirectUri: `${location.origin}/` }); } catch (error) { welcomeError.textContent = 'Sign-out could not complete. Close this tab to clear the session.'; }
});
async function startSession(nextAccount) {
  if (nextAccount.tenantId !== config.tenantId) throw new Error('Use an authorised account from the configured organisation.');
  account = nextAccount; auth.setActiveAccount(account);
  store = createSharePointStore({ config, reviewerId: account.localAccountId, getToken: async () => {
    try { return (await auth.acquireTokenSilent({ scopes, account })).accessToken; }
    catch { throw new Error('Sign-in or consent is required. Sign out and sign in again.'); }
  } });
  signedIn = true;
  document.querySelector('.sidebar-bottom strong').textContent = account.name || account.username;
  document.querySelector('.sidebar-bottom small').textContent = 'Organisational account'; document.querySelector('.avatar').textContent = (account.name || account.username).slice(0,2).toUpperCase();
  $('welcome').hidden = true; $('workspace').hidden = false;
  await operation(refresh);
}
$('enter').addEventListener('click', async () => {
  try {
    if (!auth) throw new Error('Organisational sign-in is awaiting configuration.');
    await auth.loginRedirect({ scopes, prompt: 'select_account' });
  } catch (error) { welcomeError.textContent = error.message; }
});
try {
  if (!config.tenantId || !config.clientId || !config.siteId) throw new Error('Organisational sign-in is awaiting configuration.');
  await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = './vendor/msal-browser-5.23.0.min.js'; script.onload = resolve; script.onerror = () => reject(new Error('The sign-in library could not load.')); document.head.append(script); });
  auth = new window.msal.PublicClientApplication({ auth: { clientId: config.clientId, authority: `https://login.microsoftonline.com/${config.tenantId}`, redirectUri: `${location.origin}/` }, cache: { cacheLocation: 'sessionStorage' } });
  await auth.initialize();
  const response = await auth.handleRedirectPromise();
  const existing = response?.account || auth.getActiveAccount() || auth.getAllAccounts().find(item => item.tenantId === config.tenantId);
  if (existing) await startSession(existing);
} catch (error) { welcomeError.textContent = error.message; }
