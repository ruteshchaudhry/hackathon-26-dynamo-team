// Server-only transport through the flow owner's existing list connection.
// The signed callback URL never enters browser configuration or API responses.
export function createFlowTransport(config, fetcher = fetch) {
  const prefix = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(config.siteId)}/lists/`;
  const lists = new Map([[config.stagingListId, 'staging'], [config.addedListId, 'added']]);
  const row = item => {
    const fields = { ...item };
    const id = String(item.Id ?? item.ID ?? '');
    const eTag = item['odata.etag'] || item['@odata.etag'] || item.__metadata?.etag;
    if (!/^[1-9][0-9]*$/.test(id) || !eTag) throw new Error('Invalid contact record response.');
    for (const key of Object.keys(fields)) if (key.startsWith('odata.') || key.startsWith('@odata.') || key === '__metadata') delete fields[key];
    return { id, eTag, fields };
  };
  return async function request(url, method = 'GET', body, eTag) {
    if (!url.startsWith(prefix)) throw new Error('Unexpected contact endpoint.');
    const destination = new URL(url);
    const tail = destination.pathname.slice(new URL(prefix).pathname.length);
    const match = /^([^/]+)\/items(?:\/([1-9][0-9]*)(\/fields)?)?$/.exec(tail);
    if (!match) throw new Error('Unexpected contact operation.');
    const list = lists.get(decodeURIComponent(match[1]));
    if (!list) throw new Error('Unexpected contact list.');
    const id = match[2];
    const operation = method === 'GET' ? (id ? 'get' : 'list') : method === 'POST' && !id ? 'create' : method === 'PATCH' && id && match[3] ? 'update' : method === 'DELETE' && id && !match[3] ? 'delete' : null;
    if (!operation || (operation === 'create' && list !== 'added') || (['update','delete'].includes(operation) && list !== 'staging')) throw new Error('Unsupported contact operation.');
    if (['update','delete'].includes(operation) && (!eTag || eTag === '*')) throw new Error('Contact record version required.');
    const query = new URLSearchParams();
    for (const [key, value] of destination.searchParams) {
      if (key === '$expand' && value === 'fields') continue;
      if (key === '$top' && /^\d{1,4}$/.test(value)) query.set(key,value);
      else if (key === '$filter' && /^fields\/(CandidateKey|SourceStagingId) eq '(?:[^']|'')*'$/.test(value)) query.set(key,value.replace(/^fields\//,''));
      else if (key === '$skiptoken' && value.length <= 2048) query.set(key,value);
      else throw new Error('Unsupported contact query.');
    }
    let envelope;
    try {
      const response = await fetcher(config.flowUrl, {
        method: 'POST', redirect: 'error', signal: AbortSignal.timeout(25000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list, operation, itemId: id ? Number(id) : 0, query: query.size ? `?${query}` : '', fields: operation === 'create' ? body.fields : body || {}, eTag: eTag || '' }),
      });
      if (!response.ok) throw new Error('Transport unavailable.');
      envelope = await response.json();
    } catch { throw new Error('Contact data service unavailable. Refresh before retrying.'); }
    const status = Number(envelope?.status);
    if (!Number.isInteger(status) || status < 200 || status > 599) throw new Error('Invalid contact data response.');
    if (status >= 300) {
      const error = new Error(status === 412 ? 'This record changed. Refresh and review the latest values.' : status === 409 ? 'This contact conflicts with an existing record. Refresh and review it.' : 'Contact data request failed. Refresh before retrying.');
      error.status = status; throw error;
    }
    if (['delete','update'].includes(operation)) return null;
    let data = envelope.body;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch { throw new Error('Invalid contact data response.'); } }
    // REST metadata is adapted to the review store's existing item contract.
    data = data?.d || data;
    if (operation !== 'list') return row(data);
    const values = data?.value || data?.results;
    if (!Array.isArray(values)) throw new Error('Invalid contact list response.');
    const result = { value: values.map(row) };
    const next = data['odata.nextLink'] || data['@odata.nextLink'] || data.__next;
    if (next) {
      const nextUrl = new URL(next);
      const expectedPath = `/sites/CustomerCaptureDemo/_api/web/lists(guid'${match[1]}')/items`;
      if (nextUrl.origin !== 'https://randrltd.sharepoint.com' || decodeURIComponent(nextUrl.pathname).toLowerCase() !== expectedPath.toLowerCase()) throw new Error('Unexpected contact pagination.');
      const skip = nextUrl.searchParams.get('$skiptoken');
      if (!skip || skip.length > 2048) throw new Error('Invalid contact pagination.');
      destination.searchParams.set('$skiptoken',skip);
      result['@odata.nextLink'] = destination.href;
    }
    return result;
  };
}
