/**
 * Dynamics 365 CE / Dataverse adapter — PROTOTYPE PLACEHOLDER.
 *
 * A real implementation would call the Microsoft Dataverse Web API from the
 * server, e.g.:
 *   GET  /api/data/v9.2/contacts?$filter=emailaddress1 eq '{email}'
 *   POST /api/data/v9.2/contacts
 *   POST /api/data/v9.2/{relationship_entity}
 * All responses here are simulated; created records live in the demo store.
 */
import {
  DYNAMICS_CONTACTS,
  PREMISES,
  PROPERTIES,
  type DynamicsContact,
  type PremisesRelationship,
  type RelationshipType,
} from "@/lib/mock-data";
import { getDemoState, setDemoState, useDemoState, type CreatedContact } from "@/lib/demo-store";

let nextContact = 10120;
let nextRel = 50300;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** When set, the next createContact call for this email fails once. */
let failNextFor: string | null = null;
export function simulateFailureFor(email: string | null) {
  failNextFor = email;
}

export interface ListedContact extends DynamicsContact {
  isNew: boolean;
  createdAt: string;
  premisesId?: string;
  relationshipId?: string;
  sourceMessageId?: string | undefined;
}

const SEED_CREATED: Record<string, string> = {
  "DYN-C-10021": "2025-06-12T10:14",
  "DYN-C-10034": "2025-09-03T15:40",
  "DYN-C-10047": "2025-11-21T09:05",
  "DYN-C-10052": "2024-04-18T11:30",
  "DYN-C-10068": "2024-08-02T14:22",
  "DYN-C-10073": "2023-01-09T09:00",
  "DYN-C-10089": "2023-05-15T09:00",
};

export function premisesLabel(premisesId: string) {
  const pr = PREMISES.find((p) => p.id === premisesId);
  const prop = PROPERTIES.find((p) => p.id === pr?.propertyId);
  return pr && prop ? `${prop.name}, ${pr.name}` : "";
}

function toListed(c: CreatedContact): ListedContact {
  return {
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    emailAddress: c.emailAddress,
    relatedPremises: c.relatedPremises ?? premisesLabel(c.premisesId),
    relationshipType: c.relationshipType || undefined,
    contactType: "Customer",
    isNew: true,
    createdAt: c.createdAt,
    premisesId: c.premisesId,
    relationshipId: c.relationshipId,
    sourceMessageId: c.sourceMessageId,
  };
}

export function listContactsFrom(created: CreatedContact[]): ListedContact[] {
  return [
    ...created.map(toListed),
    ...DYNAMICS_CONTACTS.map((c) => ({ ...c, isNew: false, createdAt: SEED_CREATED[c.id] ?? "2024-01-01T09:00" })),
  ];
}

/** React hook: live list of Dynamics contacts (seeded + created this session). */
export function useDynamicsContacts() {
  const s = useDemoState();
  return { contacts: listContactsFrom(s.created), lastAddedIds: s.lastAddedIds };
}

export async function findContactByEmail(emailAddress: string): Promise<DynamicsContact | null> {
  // Exact email-address match only.
  const e = emailAddress.trim().toLowerCase();
  return listContactsFrom(getDemoState().created).find((c) => c.emailAddress.toLowerCase() === e) ?? null;
}

export async function createContact(contact: {
  firstName: string;
  lastName: string;
  emailAddress: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await delay(700);
  if (failNextFor && failNextFor === contact.emailAddress) {
    failNextFor = null;
    return { ok: false, error: "Dataverse returned 503 Service Unavailable (simulated)." };
  }
  return { ok: true, id: `DYN-C-${nextContact++}` };
}

export async function createPremisesRelationship(
  relationship: Omit<PremisesRelationship, "id"> & {
    relationshipType: RelationshipType;
    contact: { firstName: string; lastName: string; emailAddress: string; sourceMessageId?: string | undefined };
  },
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  await delay(300);
  const id = `DYN-R-${nextRel++}`;
  const record: CreatedContact = {
    id: relationship.contactId,
    ...relationship.contact,
    premisesId: relationship.premisesId,
    relationshipType: relationship.relationshipType,
    relationshipId: id,
    createdAt: new Date().toISOString(),
  };
  setDemoState((s) => ({ ...s, created: [record, ...s.created] }));
  return { ok: true, id };
}

export function markLastAdded(ids: string[]) {
  setDemoState((s) => ({ ...s, lastAddedIds: ids }));
}
