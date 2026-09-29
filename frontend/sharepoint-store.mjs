// Delegated Microsoft Graph operations. Records stay in memory, never localStorage.
export function reviewedFields(input) {
  const fields = {};
  for (const key of ['Email', 'FirstName', 'LastName', 'TargetLabel', 'RelationshipLabel']) {
    fields[key] = String(input[key] ?? '').trim();
    if (fields[key].length > 255) throw new Error(`${key} must be at most 255 characters.`);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.Email)) throw new Error('Enter a valid email address.');
  fields.NormalizedEmail = fields.Email.toLowerCase();
  fields.CandidateKey = fields.NormalizedEmail;
  return fields;
}
export function createSharePointStore({ config, getToken, reviewerId, fetcher = fetch }) {
  const root = `https://graph.microsoft.com/v1.0/sites/${encodeURIComponent(config.siteId)}/lists/`;
  const bases = [config.stagingListId, config.addedListId].map(id => `${root}${encodeURIComponent(id)}/items`);
  const [staging, added] = bases;
  async function request(url, method = 'GET', body, etag) {
    // Only configured list endpoints (including their pagination) can receive a token.
    const destination = new URL(url);
    if (destination.username || destination.password || !bases.some(base => destination.href === base || destination.href.startsWith(`${base}?`) || destination.href.startsWith(`${base}/`))) throw new Error('Unexpected SharePoint endpoint.');
    const token = await getToken();
    const headers = { Authorization: `Bearer ${token}` };
    if (body) headers['Content-Type'] = 'application/json';
    if (etag) headers['If-Match'] = etag;
    const response = await fetcher(url, { method, headers, body: body ? JSON.stringify(body) : undefined, redirect: 'error' });
    if (!response.ok) {
      const messages = { 401: 'Your session expired. Sign out and sign in again.', 403: 'Access denied. Check the app grant and your SharePoint list permissions.', 409: 'This contact conflicts with an existing record. Refresh and review it.', 412: 'This record changed. Refresh and review the latest values.', 429: 'SharePoint is busy. Wait briefly, then refresh before retrying.' };
      const error = new Error(messages[response.status] || `SharePoint request failed (${response.status}). Refresh before retrying.`);
      error.status = response.status; throw error;
    }
    return response.status === 204 ? null : response.json();
  }
  async function pages(url) {
    const rows = [], visited = new Set();
    while (url) {
      if (visited.has(url) || visited.size >= 1000) throw new Error('SharePoint pagination could not complete. Counts are unavailable.');
      visited.add(url);
      const result = await request(url);
      if (!Array.isArray(result.value)) throw new Error('Unexpected SharePoint list response.');
      rows.push(...result.value); url = result['@odata.nextLink'];
    }
    return rows;
  }
  const itemURL = (base, id) => `${base}/${encodeURIComponent(id)}`;
  const get = (base, id) => request(`${itemURL(base, id)}?$expand=fields`);
  const lookup = async (column, value) => {
    const query = new URLSearchParams({ '$expand': 'fields', '$filter': `fields/${column} eq '${String(value).replaceAll("'", "''")}'` });
    const rows = await pages(`${added}?${query}`);
    if (rows.length > 1) throw new Error('Duplicate approved records detected. Keep staging for investigation.');
    return rows[0];
  };
  const version = row => {
    const etag = row.eTag || row['@odata.etag'];
    if (!etag) throw new Error('SharePoint did not return a record version. Refresh before editing.');
    return etag;
  };
  const patch = (row, fields) => request(`${itemURL(staging, row.id)}/fields`, 'PATCH', fields, version(row));
  async function current(expected) {
    const row = await get(staging, expected.id);
    if (version(row) !== version(expected)) throw new Error('This record changed. Refresh and review the latest values.');
    return row;
  }
  function editable(row) {
    if (!['Pending', 'Failed', undefined, ''].includes(row.fields.Status)) throw new Error('Approval has started. Retry to finish the saved approval; edits are locked.');
  }
  async function save(expected, input) {
    const row = await current(expected); editable(row);
    const fields = reviewedFields(input);
    if (await lookup('CandidateKey', fields.CandidateKey)) throw new Error('That email is already in AddedContacts. Staging has been retained for review.');
    // A corrected display reference must not retain an unrelated Dynamics identity.
    if (fields.TargetLabel !== (row.fields.TargetLabel || '')) Object.assign(fields, { TargetId: '', TargetType: '', DevelopmentId: '', PropertyId: '', PremisesId: '' });
    if (fields.RelationshipLabel !== (row.fields.RelationshipLabel || '')) fields.RelationshipCode = '';
    if (fields.NormalizedEmail !== (row.fields.NormalizedEmail || '').toLowerCase()) fields.ExistingDynamicsContactId = '';
    await patch(row, { ...fields, Status: 'Pending', ErrorMessage: '' });
    return get(staging, row.id);
  }
  async function approve(expected) {
    let row = await current(expected);
    let result = await lookup('SourceStagingId', row.id);
    if (!result) {
      reviewedFields(row.fields);
      if (await lookup('CandidateKey', row.fields.CandidateKey)) throw new Error('That email is already approved from another suggestion. Staging has been retained for review.');
      if (!['Pending', 'Failed', 'Processing', undefined, ''].includes(row.fields.Status)) throw new Error('The saved approval is missing. Keep this staging record for investigation.');
      if (row.fields.Status !== 'Processing') {
        const reviewed = JSON.stringify(reviewedFields(row.fields));
        await patch(row, { Status: 'Processing', ErrorMessage: '' });
        row = await get(staging, row.id);
        if (reviewed !== JSON.stringify(reviewedFields(row.fields))) throw new Error('Contact details changed after review. Staging is retained.');
        if (row.fields.Status !== 'Processing') throw new Error('Approval state changed. Refresh before retrying.');
      }
      const f = row.fields, fields = {};
      const shared = ['Email','NormalizedEmail','FirstName','LastName','TargetType','TargetLabel','RelationshipCode','RelationshipLabel','PropertyId','ExistingDynamicsContactId','SourceMailbox','SourceMessageId','Subject','AssignedReviewerId','CandidateKey','RecipientAddresses','EvidenceExcerpt','ReceivedAt'];
      for (const key of shared) if (f[key] !== undefined && f[key] !== null && f[key] !== '') fields[key] = f[key];
      for (const [source, destination] of [['TargetId','TargetID'],['DevelopmentId','DevelpmentId'],['PremisesId','PremiseId']]) if (f[source]) fields[destination] = f[source];
      Object.assign(fields, reviewedFields(f), {
        Title: [f.FirstName, f.LastName].filter(Boolean).join(' ') || f.Email,
        SourceStagingId: String(row.id), DemoContactId: `demo-contact-${row.id}`,
        Outcome: 'SimulatedAddition', SimulatedContactCreated: true, SimulatedRelationshipCreated: false,
        ApprovedBy: reviewerId, ApprovedAt: new Date().toISOString(),
      });
      try {
        await request(added, 'POST', { fields });
      } catch (error) {
        // A lost response or competing request may already have committed the result.
        result = await lookup('SourceStagingId', row.id);
        if (!result) {
          if (error.status && error.status >= 400 && error.status < 500) {
            try { await patch(row, { Status: 'Failed', ErrorMessage: error.message.slice(0, 255) }); } catch { /* Never overwrite another reviewer's changes. */ }
          }
          throw error;
        }
      }
      // Read after write: never delete staging based solely on a successful POST response.
      result ||= await lookup('SourceStagingId', row.id);
      if (!result) throw new Error('The approval could not be confirmed. Staging is retained. Refresh and retry.');
    }
    // Compare the frozen review fields to avoid deleting a subsequently edited suggestion.
    const approved = reviewedFields(result.fields), proposed = reviewedFields(row.fields);
    if (JSON.stringify(approved) !== JSON.stringify(proposed)) throw new Error('Approved values differ from staging. Both records are retained for investigation.');
    try {
      await request(itemURL(staging, row.id), 'DELETE', undefined, version(row));
      return { result, cleanupPending: false };
    } catch (error) {
      if (error.status === 404) return { result, cleanupPending: false };
      try { await patch(row, { Status: 'CleanupPending', ResultItemId: String(result.id), ErrorMessage: 'Approved contact saved. Retry to remove staging.' }); } catch { /* A changed staging item must stay intact. */ }
      return { result, cleanupPending: true };
    }
  }
  return {
    async read() {
      const [pending, approved] = await Promise.all([pages(`${staging}?$expand=fields&$top=200`), pages(`${added}?$expand=fields&$top=200`)]);
      return { pending, added: approved };
    }, save, approve,
  };
}
