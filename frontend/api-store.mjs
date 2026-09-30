// The browser calls only this app's API. It never obtains a SharePoint/Graph token.
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

export function createApiStore({ getToken, fetcher = fetch }) {
  async function request(path, method = 'GET', body) {
    const response = await fetcher(`/api/contacts${path}`, {
      method, redirect: 'error', cache: 'no-store',
      headers: { 'X-Capture-Authorization': `Bearer ${await getToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || `Contacts are temporarily unavailable (${response.status}). Please retry later.`);
    if (!data) throw new Error('Contacts could not be loaded. Please refresh and try again.');
    return data;
  }
  const expected = row => ({ id: String(row.id), eTag: row.eTag || row['@odata.etag'] });
  return {
    read: () => request(''),
    save: (row, fields) => request('/save', 'POST', { expected: expected(row), fields: reviewedFields(fields) }),
    approve: row => request('/approve', 'POST', { expected: expected(row) }),
  };
}
