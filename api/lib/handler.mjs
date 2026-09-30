import { createSharePointStore, reviewedFields } from './sharepoint-store.mjs';

const reply = (status, jsonBody) => ({ status, jsonBody, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json', ...(status === 401 ? { 'WWW-Authenticate': 'Bearer' } : {}) } });
export function createHandler({ authenticate, config, getToken, fetcher = fetch, storeFactory = createSharePointStore }) {
  return async request => {
    let identity;
    try { identity = await authenticate(request.headers.get('authorization')); }
    catch (error) { return reply(401, { error: error.message }); }
    const action = request.params?.action || '';
    const read = request.method === 'GET' && action === '';
    const write = request.method === 'POST' && ['save', 'approve'].includes(action);
    if (!read && !write) return reply(404, { error: 'Unknown app operation.' });
    let body;
    if (write) {
      try {
        if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('JSON body required.');
        if (Number(request.headers.get('content-length')) > 8192) throw new Error('Request too large.');
        const raw = await request.text();
        if (Buffer.byteLength(raw) > 8192) throw new Error('Request too large.');
        body = JSON.parse(raw);
        if (!body || !/^[1-9][0-9]*$/.test(String(body.expected?.id)) || typeof body.expected?.eTag !== 'string' ||
            !body.expected.eTag || body.expected.eTag.length > 256 || /[\r\n]/.test(body.expected.eTag) || body.expected.eTag === '*') throw new Error('This contact needs refreshing. Refresh and retry.');
        if (action === 'save') {
          if (!body.fields || typeof body.fields !== 'object' || Array.isArray(body.fields)) throw new Error('Contact fields required.');
          body.fields = reviewedFields(body.fields);
        }
      } catch (error) { return reply(400, { error: error instanceof SyntaxError ? 'Invalid JSON request.' : error.message }); }
    }
    // IDs, credentials and reviewer identity are never taken from the request body.
    const store = storeFactory({ config, getToken, reviewerId: identity.reviewerId, fetcher });
    try {
      if (read) return reply(200, await store.read());
      const expected = { id: String(body.expected.id), eTag: body.expected.eTag };
      return reply(200, action === 'save' ? await store.save(expected, body.fields) : await store.approve(expected));
    } catch (error) {
      // Only fixed store/business messages are exposed; raw network errors can contain URLs.
      const status = [409, 412].includes(error.status) || /changed|already|differ|Approval has started/.test(error.message) ? 409 : 502;
      const known = /^(This |That |Approval |The saved|Contact details|The approval|Approved values|Duplicate approved|Enter a valid|Email must|FirstName must|LastName must|TargetLabel must|RelationshipLabel must)/.test(error.message);
      return reply(status, { error: known ? error.message.replaceAll('AddedContacts', 'added contacts').replaceAll('staging', 'pending review').replaceAll('Staging', 'Pending review') : 'We could not complete this action. Refresh before retrying. Your pending contact is kept until its addition is confirmed.' });
    }
  };
}
