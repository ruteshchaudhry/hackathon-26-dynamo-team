import test from 'node:test';
import assert from 'node:assert/strict';
import { createSharePointStore } from '../api/lib/sharepoint-store.mjs';
const initial = () => ({ id: '1', eTag: '"1"', fields: { Status: 'Pending', Email: 'alex@example.com', NormalizedEmail: 'alex@example.com', CandidateKey: 'alex@example.com', FirstName: 'Alex', LastName: 'Morgan', TargetLabel: 'Willow Court', RelationshipLabel: 'Resident', TargetId: 'real-property-id', DevelopmentId: 'real-development-id', PremisesId: 'real-premises-id', RelationshipCode: 'resident' } });
function fixture() {
  const lists = { staging: [initial()], added: [] }, calls = [];
  let sequence = 1, failPost = false, losePost = false, failDelete = false, pagination = false, malicious = false;
  const response = (status, body = {}) => new Response(status === 204 ? null : JSON.stringify(body), { status });
  const fetcher = async (url, options) => {
    const u = new URL(url), match = u.pathname.match(/lists\/(staging|added)\/items(?:\/([^/]+))?(\/fields)?$/);
    assert.ok(match, url); const [, list, id, fieldPath] = match;
    calls.push({ list, id, method: options.method, body: options.body ? JSON.parse(options.body) : null });
    const rows = lists[list], item = rows.find(row => row.id === id);
    if (id && !item) return response(404);
    if (item && options.headers['If-Match'] && item.eTag !== options.headers['If-Match']) return response(412);
    if (options.method === 'GET') {
      if (id) return response(200, item);
      const filter = u.searchParams.get('$filter');
      if (filter) {
        const [, key, value] = filter.match(/fields\/(\w+) eq '(.*)'/);
        return response(200, { value: rows.filter(row => String(row.fields[key]) === value.replaceAll("''", "'")) });
      }
      if (malicious && list === 'staging') return response(200, { value: [], '@odata.nextLink': 'https://evil.example/steal' });
      if (pagination && list === 'added' && !u.searchParams.has('page')) return response(200, { value: rows.slice(0, 1), '@odata.nextLink': `${url}&page=2` });
      return response(200, { value: pagination && list === 'added' ? rows.slice(1) : rows });
    }
    if (options.method === 'PATCH') {
      assert.ok(fieldPath); Object.assign(item.fields, JSON.parse(options.body)); item.eTag = `"${++sequence}"`; return response(200, item.fields);
    }
    if (options.method === 'POST') {
      if (failPost) return response(403);
      const { fields } = JSON.parse(options.body);
      if (rows.some(row => row.fields.CandidateKey === fields.CandidateKey || row.fields.SourceStagingId === fields.SourceStagingId)) return response(409);
      const created = { id: String(++sequence), eTag: `"${sequence}"`, fields }; rows.push(created);
      if (losePost) throw new Error('Connection dropped after server commit');
      return response(201, created);
    }
    if (options.method === 'DELETE') {
      if (failDelete) return response(503);
      rows.splice(rows.indexOf(item), 1); return response(204);
    }
    throw new Error('Unexpected method');
  };
  const store = createSharePointStore({ config: { siteId: 'site', stagingListId: 'staging', addedListId: 'added' }, getToken: async () => 'fake-test-token', reviewerId: 'reviewer-id', fetcher });
  return { store, lists, calls, failPost: () => failPost = true, losePost: () => losePost = true, deleteFailure: flag => failDelete = flag, paginate: () => pagination = true, malicious: () => malicious = true };
}
test('corrected values are saved before staging deletion and counted from durable contacts', async () => {
  const f = fixture();
  const saved = await f.store.save(initial(), { ...initial().fields, FirstName: 'Alexander', Email: 'corrected@example.com' });
  const result = await f.store.approve(saved);
  assert.equal(result.cleanupPending, false); assert.equal(f.lists.staging.length, 0); assert.equal(f.lists.added.length, 1);
  assert.equal(f.lists.added[0].fields.FirstName, 'Alexander'); assert.equal(f.lists.added[0].fields.CandidateKey, 'corrected@example.com');
  assert.equal(f.lists.added[0].fields.TargetID, 'real-property-id'); assert.equal(f.lists.added[0].fields.DevelpmentId, 'real-development-id');
  assert.equal(f.lists.added[0].fields.PremiseId, 'real-premises-id'); assert.equal(f.lists.added[0].fields.SimulatedContactCreated, true);
  assert.equal(f.lists.added[0].fields.SimulatedRelationshipCreated, false);
  const post = f.calls.findIndex(c => c.method === 'POST'), deletion = f.calls.findIndex(c => c.method === 'DELETE');
  assert.ok(deletion > post); assert.ok(f.calls.slice(post + 1, deletion).some(c => c.list === 'added' && c.method === 'GET'));
  assert.equal((await f.store.read()).added.length, 1);
});
test('failed create retains the reviewed staging record', async () => {
  const f = fixture(); f.failPost();
  await assert.rejects(f.store.approve(initial()), /Access denied/);
  assert.equal(f.lists.staging.length, 1); assert.equal(f.lists.added.length, 0); assert.equal(f.lists.staging[0].fields.Status, 'Failed');
  assert.ok(!f.calls.some(c => c.method === 'DELETE'));
});
test('lost create response resolves persisted result without creating again', async () => {
  const f = fixture(); f.losePost(); await f.store.approve(initial());
  assert.equal(f.lists.added.length, 1); assert.equal(f.lists.staging.length, 0);
});
test('cleanup retry removes staging and preserves a single durable approved contact', async () => {
  const f = fixture(); f.deleteFailure(true);
  assert.equal((await f.store.approve(initial())).cleanupPending, true);
  assert.equal(f.lists.staging[0].fields.Status, 'CleanupPending'); assert.equal(f.lists.added.length, 1);
  f.deleteFailure(false); await f.store.approve(structuredClone(f.lists.staging[0]));
  assert.equal(f.lists.staging.length, 0); assert.equal(f.lists.added.length, 1);
  assert.equal(f.calls.filter(c => c.method === 'POST').length, 1);
});
test('stale review cannot overwrite or approve a newer version', async () => {
  const f = fixture(); f.lists.staging[0].eTag = '"newer"';
  await assert.rejects(f.store.approve(initial()), /record changed/);
  await assert.rejects(f.store.save(initial(), initial().fields), /record changed/);
  assert.ok(!f.calls.some(c => c.method !== 'GET'));
});
test('duplicate email from another suggestion retains staging without another contact', async () => {
  const f = fixture(); f.lists.added.push({ id: '10', fields: { ...initial().fields, SourceStagingId: 'different' } });
  await assert.rejects(f.store.approve(initial()), /already approved/);
  assert.equal(f.lists.staging.length, 1); assert.equal(f.lists.added.length, 1);
});
test('changed property description clears stale Dynamics IDs', async () => {
  const f = fixture(); const saved = await f.store.save(initial(), { ...initial().fields, TargetLabel: 'Another property', RelationshipLabel: 'Leaseholder' });
  assert.equal(saved.fields.TargetId, ''); assert.equal(saved.fields.DevelopmentId, ''); assert.equal(saved.fields.PremisesId, ''); assert.equal(saved.fields.RelationshipCode, '');
});
test('pagination includes all approved contacts and rejects off-site token destinations', async () => {
  const f = fixture(); f.paginate(); f.lists.added.push({ id: '10', fields: {} }, { id: '11', fields: {} });
  assert.equal((await f.store.read()).added.length, 2);
  f.malicious(); await assert.rejects(f.store.read(), /Unexpected SharePoint endpoint/);
});
test('two reviewers competing on the same version cannot create two contacts', async () => {
  const f = fixture(); const results = await Promise.allSettled([f.store.approve(initial()), f.store.approve(initial())]);
  assert.ok(results.some(result => result.status === 'fulfilled'));
  assert.equal(f.lists.added.length, 1); assert.equal(f.lists.staging.length, 0);
});
test('cleanup refuses to remove staging whose reviewed fields differ from saved approval', async () => {
  const f = fixture(); f.deleteFailure(true); await f.store.approve(initial());
  f.lists.staging[0].fields.FirstName = 'Changed later'; f.deleteFailure(false);
  await assert.rejects(f.store.approve(structuredClone(f.lists.staging[0])), /differ from staging/);
  assert.equal(f.lists.staging.length, 1);
});
