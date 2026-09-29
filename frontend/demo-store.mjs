const KEY = 'customer-capture-contacts-demo-v2';
export const targets = [
  { id: 'demo-property-1', type: 'Property', label: 'Willow Court · DEMO-001' },
  { id: 'demo-property-2', type: 'Property', label: 'Harbour House · DEMO-002' },
];
export const roles = ['Resident', 'Leaseholder', 'Director'];
const fixtures = [
  { id: 'sample-1', email: 'alex.morgan@example.com', firstName: 'Alex', lastName: 'Morgan', targetId: targets[0].id, role: 'Leaseholder', subject: 'DEMO-001 — leaseholder contact', excerpt: 'I am Alex Morgan, a leaseholder at Willow Court (DEMO-001). Please use this address to contact me.', match: 'New contact' },
  { id: 'sample-2', email: 'casey.patel@example.com', firstName: 'Casey', lastName: 'Patel', targetId: targets[1].id, role: 'Director', subject: 'DEMO-002 — director contact', excerpt: 'Please record my role as Director at Harbour House (DEMO-002).', match: 'New contact' },
  { id: 'sample-3', email: 'jordan.lee@example.com', firstName: 'Jordan', lastName: 'Lee', targetId: '', role: '', subject: 'Property contact details', excerpt: 'Please add me as a property contact. The property reference and my role still need confirmation.', match: 'Needs property and relationship' },
  { id: 'sample-4', email: 'alex.morgan@example.com', firstName: 'Alex', lastName: 'Morgan', targetId: targets[1].id, role: 'Resident', subject: 'DEMO-002 — another property', excerpt: 'I am also a resident at Harbour House (DEMO-002).', match: 'Additional property relationship' },
];
export const candidateKey = row => row.email.trim().toLowerCase();
export function validate(row) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) throw new Error('Enter a valid email address.');
  if (row.targetId && !targets.some(target => target.id === row.targetId)) throw new Error('Choose a listed property or leave it blank.');
  if (row.role && !roles.includes(row.role)) throw new Error('Choose a listed relationship or leave it blank.');
}
export function createDemoStore(storage) {
  const fresh = () => ({ schema: 1, pending: fixtures.slice(0, 3).map(row => ({ ...row, version: 1 })), added: [] });
  const write = state => { storage.setItem(KEY, JSON.stringify(state)); return structuredClone(state); };
  const read = () => {
    const raw = storage.getItem(KEY);
    if (!raw) return write(fresh());
    const state = JSON.parse(raw);
    if (state.schema !== 1 || !Array.isArray(state.pending) || !Array.isArray(state.added)) throw new Error('Demo data could not be loaded. Reset the sample data to continue.');
    return state;
  };
  const current = (state, id, version) => {
    const row = state.pending.find(item => item.id === id);
    if (!row) throw new Error('This suggestion was already processed. Refresh the list.');
    if (row.version !== version) throw new Error('This suggestion changed. Reopen it to review the latest values.');
    return row;
  };
  return {
    read,
    reset: () => write(fresh()),
    scan() {
      const state = read(); let count = 0;
      for (const row of fixtures) {
        const bySource = [...state.pending, ...state.added].some(item => item.id === row.id || item.sourceStagingId === row.id);
        const byKey = [...state.pending, ...state.added].some(item => candidateKey(item) === candidateKey(row));
        if (!bySource && !byKey) { state.pending.push({ ...row, version: 1 }); count++; }
      }
      write(state); return count;
    },
    save(id, version, fields) {
      const state = read(); const row = current(state, id, version);
      for (const name of ['email', 'firstName', 'lastName', 'targetId', 'role']) row[name] = String(fields[name] ?? '').trim();
      row.version++;
      write(state); return structuredClone(row);
    },
    approve(id, version) {
      const state = read();
      const previous = state.added.find(row => row.sourceStagingId === id);
      if (previous) return { row: previous, duplicate: true };
      const row = current(state, id, version); validate(row);
      const existing = state.added.find(item => candidateKey(item) === candidateKey(row));
      if (existing) throw new Error('This email is already in demo contacts. Review the duplicate suggestion.');
      const result = { ...row, email: row.email.toLowerCase(), existingContactId: '',
        sourceStagingId: id, id: `result-${id}`, approvedAt: new Date().toISOString(), approvedBy: 'Demo reviewer',
        demoContactId: `demo-contact-${id}`, simulatedContactCreated: true,
        simulatedRelationshipCreated: false, outcome: 'SimulatedAddition' };
      state.added.push(result);
      state.pending = state.pending.filter(item => item.id !== id);
      // Persist both arrays together. If storage fails, the original pending item survives.
      write(state); return { row: result, duplicate: false };
    },
  };
}
