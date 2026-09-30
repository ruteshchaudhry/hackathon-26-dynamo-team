import { getDemoState, setDemoState } from "@/lib/demo-store";
import {
  DYNAMICS_CONTACTS, EXTRACTED_SUGGESTIONS, INBOX, MAILBOX,
  PREMISES, PROPERTIES, RELATIONSHIP_TYPES, SCAN_RANGE, type RelationshipType,
} from "@/lib/mock-data";

export interface SyncRow {
  id: string;
  version: number;
  sourceMessageId: string;
  email: string;
  firstName: string;
  lastName: string;
  targetId: string;
  premises: string;
  role: RelationshipType | "";
  subject: string;
  excerpt: string;
  sourceStagingId?: string;
  approvedAt?: string;
  demoContactId?: string;
}

export interface SyncState {
  pending: SyncRow[];
  added: SyncRow[];
  rejected: SyncRow[];
  emailsScanned: number;
  entered: boolean;
}

export const targets = PROPERTIES.map(p => ({ id: p.id, type: "Property", label: p.name }));
export const roles = [...RELATIONSHIP_TYPES];

function fresh(): SyncState {
  const messages = INBOX.filter(m => m.mailboxId === MAILBOX &&
    m.receivedAt >= SCAN_RANGE.from && m.receivedAt <= `${SCAN_RANGE.to}T23:59`);
  return {
    pending: messages.filter(m => EXTRACTED_SUGGESTIONS[m.senderEmail]).map(m => {
      const suggestion = EXTRACTED_SUGGESTIONS[m.senderEmail];
      return {
        id: `sc-${m.id}`, version: 1, sourceMessageId: m.id,
        email: m.senderEmail, firstName: suggestion.firstName, lastName: suggestion.lastName,
        targetId: suggestion.propertyId, premises: suggestion.unit, role: suggestion.relationshipType,
        subject: m.subject, excerpt: m.body,
      };
    }),
    added: [], rejected: [], emailsScanned: messages.length, entered: false,
  };
}

export function validateSyncRow(row: SyncRow) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) throw new Error("Enter a valid email address.");
  if (row.targetId && !targets.some(t => t.id === row.targetId)) throw new Error("Choose a listed property or leave it blank.");
  if (row.premises.length > 120) throw new Error("Keep premises to 120 characters or fewer.");
  if (row.role && !roles.includes(row.role)) throw new Error("Choose a listed relationship or leave it blank.");
}

function read(): SyncState {
  if (!getDemoState().sync) setDemoState(s => ({ ...s, sync: fresh() }));
  return structuredClone(getDemoState().sync!);
}

function write(sync: SyncState) {
  setDemoState(s => ({ ...s, sync }));
}

function current(state: SyncState, id: string, version: number) {
  const row = state.pending.find(r => r.id === id);
  if (!row) throw new Error("This suggestion was already processed. Refresh the list.");
  if (row.version !== version) throw new Error("This suggestion changed. Reopen it to review the latest values.");
  return row;
}

// Synchronous bridge for the supplied HTML. Every approval updates the same
// in-memory records used by the existing Outlook and Dynamics React screens.
export const dynamineStore = {
  read,
  enter() { const state = read(); state.entered = true; write(state); },
  reset() {
    const state = { ...fresh(), entered: true };
    setDemoState(s => ({ ...s, sync: state, created: [], processedMessageIds: [], lastAddedIds: [] }));
    return structuredClone(state);
  },
  save(id: string, version: number, fields: SyncRow) {
    const state = read();
    const row = current(state, id, version);
    const updated = {
      ...row,
      email: fields.email.trim(), firstName: fields.firstName.trim(), lastName: fields.lastName.trim(),
      targetId: fields.targetId.trim(), premises: fields.premises.trim(), role: fields.role,
      version: row.version + 1,
    };
    validateSyncRow(updated);
    state.pending = state.pending.map(r => r.id === id ? updated : r);
    write(state);
    return structuredClone(updated);
  },
  rejectMany(rows: Pick<SyncRow, "id" | "version">[]) {
    const state = read();
    const removed = [...new Map(rows.map(r => [r.id, r])).values()].map(r => current(state, r.id, r.version));
    const ids = new Set(removed.map(r => r.id));
    state.pending = state.pending.filter(r => !ids.has(r.id));
    state.rejected.push(...removed);
    write(state);
    return structuredClone(removed);
  },
  restoreRejectedMany(ids: string[]) {
    const state = read();
    const unique = new Set(ids);
    const restored = [...unique].map(id => {
      const row = state.rejected.find(r => r.id === id);
      if (!row) throw new Error("This suggestion has already been restored.");
      return { ...row, version: row.version + 1 };
    });
    state.pending.push(...restored);
    state.rejected = state.rejected.filter(r => !unique.has(r.id));
    write(state);
  },
  approve(id: string, version: number) {
    const state = read();
    const previous = state.added.find(r => r.sourceStagingId === id);
    if (previous) return { row: previous, duplicate: true };
    const row = current(state, id, version);
    validateSyncRow(row);
    const email = row.email.trim().toLowerCase();
    const demo = getDemoState();
    if ([...DYNAMICS_CONTACTS, ...demo.created].some(c => c.emailAddress.toLowerCase() === email)) {
      throw new Error("This email already exists in Dynamics. Review the duplicate suggestion.");
    }
    const createdAt = new Date().toISOString();
    const contactId = `DYN-C-${10120 + demo.created.length}`;
    const matchedPremises = PREMISES.find(p => p.propertyId === row.targetId && p.name === row.premises);
    const property = PROPERTIES.find(p => p.id === row.targetId);
    const result = { ...row, id: `result-${id}`, email, sourceStagingId: id, approvedAt: createdAt, demoContactId: contactId };
    state.added.push(result);
    state.pending = state.pending.filter(r => r.id !== id);
    setDemoState(s => ({
      ...s, sync: state,
      created: [{
        id: contactId, firstName: row.firstName, lastName: row.lastName, emailAddress: email,
        premisesId: matchedPremises?.id ?? "", relatedPremises: [property?.name, row.premises].filter(Boolean).join(", "),
        relationshipType: row.role, relationshipId: row.targetId && row.premises && row.role ? `DYN-R-${50300 + s.created.length}` : "",
        sourceMessageId: row.sourceMessageId, createdAt,
      }, ...s.created],
      processedMessageIds: [...new Set([...s.processedMessageIds, row.sourceMessageId])],
      lastAddedIds: [...new Set([...s.lastAddedIds, contactId])],
    }));
    return { row: structuredClone(result), duplicate: false };
  },
};
