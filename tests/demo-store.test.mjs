import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoStore, targets } from '../frontend/demo-store.mjs';
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; };
test('approval persists outcome before removing staging and repeated calls stay idempotent', () => {
  const store = createDemoStore(memory()); const row = store.read().pending[0];
  store.approve(row.id, row.version); store.approve(row.id, row.version);
  assert.equal(store.read().added.length, 1); assert.equal(store.read().pending.length, 2);
  store.scan(); store.scan(); assert.equal(store.read().pending.length, 3);
});
test('same contact at two properties shares one identity', () => {
  const store = createDemoStore(memory()); store.scan();
  const rows = store.read().pending.filter(row => row.email === 'alex.morgan@example.com');
  for (const row of rows) store.approve(row.id, row.version);
  const [a, b] = store.read().added;
  assert.equal(a.demoContactId, b.demoContactId); assert.equal(a.simulatedContactCreated, true); assert.equal(b.simulatedContactCreated, false);
});
test('missing target and stale edits do not approve or overwrite', () => {
  const store = createDemoStore(memory()); const row = store.read().pending[2];
  assert.throws(() => store.approve(row.id, row.version), /Choose a property/);
  store.save(row.id, row.version, { ...row, targetId: targets[0].id, role: 'Resident' });
  assert.throws(() => store.save(row.id, row.version, row), /changed/);
  assert.throws(() => store.approve(row.id, row.version), /changed/);
  assert.equal(store.read().added.length, 0);
});
test('corrected email does not retain a stale CRM match', () => {
  const store = createDemoStore(memory()); const row = store.read().pending[1];
  const saved = store.save(row.id, row.version, { ...row, email: 'new.person@example.com' });
  const { row: result } = store.approve(saved.id, saved.version);
  assert.equal(result.existingContactId, ''); assert.equal(result.simulatedContactCreated, true);
});
test('storage write failure preserves the staged record', () => {
  const storage = memory(); const store = createDemoStore(storage); const row = store.read().pending[0];
  const write = storage.setItem; storage.setItem = () => { throw new Error('Storage full'); };
  assert.throws(() => store.approve(row.id, row.version), /Storage full/);
  storage.setItem = write;
  assert.equal(store.read().pending.length, 3); assert.equal(store.read().added.length, 0);
});
