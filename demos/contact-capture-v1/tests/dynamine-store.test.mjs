import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const { dynamineStore: store } = await server.ssrLoadModule('/src/lib/dynamine-store.ts');
const { getDemoState, resetDemo } = await server.ssrLoadModule('/src/lib/demo-store.ts');
const { listContactsFrom } = await server.ssrLoadModule('/src/lib/integrations/dynamics.ts');
const { INBOX, EXTRACTED_SUGGESTIONS, DYNAMICS_CONTACTS } = await server.ssrLoadModule('/src/lib/mock-data.ts');
after(() => server.close());
beforeEach(() => resetDemo());

test('all original suggestions and source emails populate the new design', () => {
  const state = store.read();
  assert.equal(state.emailsScanned, 30);
  assert.equal(state.pending.length, 8);
  assert.equal(INBOX.length, 31); // Includes the invitation after the scan window.
  assert.equal(DYNAMICS_CONTACTS.length, 7);
  for (const row of state.pending) {
    const original = EXTRACTED_SUGGESTIONS[row.email];
    assert.deepEqual([row.firstName, row.lastName, row.targetId, row.premises, row.role],
      [original.firstName, original.lastName, original.propertyId, original.unit, original.relationshipType]);
    const message = INBOX.find(m => m.id === row.sourceMessageId);
    assert.equal(row.subject, message.subject);
    assert.equal(row.excerpt, message.body);
  }
});

test('edited approval is atomic across sync, Outlook and Dynamics; retry is idempotent', () => {
  const row = store.read().pending.find(r => r.email === 'emma.brown@email.com');
  const edited = store.save(row.id, row.version, { ...row, firstName: 'Emma Jane', premises: 'Flat 8', role: 'Owner' });
  const result = store.approve(edited.id, edited.version);
  assert.equal(store.read().pending.length, 7);
  assert.equal(store.read().added[0].firstName, 'Emma Jane');
  const demo = getDemoState();
  assert.deepEqual(demo.processedMessageIds, [row.sourceMessageId]);
  const contact = listContactsFrom(demo.created).find(c => c.id === result.row.demoContactId);
  assert.equal(contact.firstName, 'Emma Jane');
  assert.equal(contact.relatedPremises, 'Maple Gardens, Flat 8');
  assert.equal(contact.relationshipType, 'Owner');
  assert.equal(contact.sourceMessageId, row.sourceMessageId);
  assert.equal(store.approve(edited.id, edited.version).duplicate, true);
  assert.equal(getDemoState().created.length, 1);
});

test('duplicate emails cannot be added and leave the suggestion available to correct', () => {
  const row = store.read().pending[0];
  const edited = store.save(row.id, row.version, { ...row, email: 'MARTIN.LEE@email.com' });
  assert.throws(() => store.approve(edited.id, edited.version), /already exists/);
  assert.equal(store.read().pending.length, 8);
  assert.equal(getDemoState().created.length, 0);
  assert.deepEqual(getDemoState().processedMessageIds, []);
});

test('ignore and undo preserve data, reject stale versions and do not write to Dynamics', () => {
  const rows = store.read().pending.slice(0, 2);
  store.rejectMany(rows);
  assert.equal(store.read().pending.length, 6);
  store.restoreRejectedMany(rows.map(r => r.id));
  assert.equal(store.read().pending.length, 8);
  assert.equal(store.read().rejected.length, 0);
  assert.equal(getDemoState().created.length, 0);
  assert.throws(() => store.approve(rows[0].id, rows[0].version), /changed/);
});

test('optional missing fields follow the HTML design; reset restores all shared fixtures', () => {
  const row = store.read().pending.find(r => r.email === 'emma.brown@email.com');
  store.approve(row.id, row.version);
  const listed = listContactsFrom(getDemoState().created)[0];
  assert.equal(listed.relatedPremises, 'Maple Gardens');
  assert.equal(listed.relationshipType, undefined);
  store.reset();
  assert.equal(store.read().pending.length, 8);
  assert.equal(store.read().added.length, 0);
  assert.equal(getDemoState().created.length, 0);
  assert.equal(listContactsFrom(getDemoState().created).length, 7);
  assert.deepEqual(getDemoState().processedMessageIds, []);
});
