// Seeded demo data for Contact Capture. No live Outlook or Dynamics data is used.

export type EmailCategory =
  | "NewCustomer"
  | "ExistingCustomer"
  | "Supplier"
  | "Internal"
  | "Automated"
  | "Newsletter"
  | "Spam";

export type RelationshipType =
  | "Owner"
  | "Sub-Tenant"
  | "Letting Agent"
  | "Authorised Representative"
  | "New Owner Awaiting Land Reg";
export const RELATIONSHIP_TYPES: RelationshipType[] = [
  "Owner",
  "Sub-Tenant",
  "Letting Agent",
  "Authorised Representative",
  "New Owner Awaiting Land Reg",
];

export interface EmailMessage {
  id: string;
  mailboxId: string;
  senderName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  body: string;
  receivedAt: string; // ISO
  category: EmailCategory;
  processedStatus: "Unprocessed" | "Processed";
}

export interface SuggestedContact {
  id: string;
  emailMessageId: string;
  emailAddress: string;
  firstName: string;
  lastName: string;
  propertyId: string;
  premisesId: string;
  relationshipType: RelationshipType | "";
  selected: boolean;
  status: "Ready" | "Added" | "Failed";
}

export interface Property {
  id: string;
  name: string;
  address: string;
  postcode: string;
}

export interface Premises {
  id: string;
  propertyId: string;
  name: string;
  fullAddress: string;
}

export interface DynamicsContact {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  relatedPremises: string;
  relationshipType?: RelationshipType;
  contactType: "Customer" | "Contractor" | "Colleague";
}

export interface PremisesRelationship {
  id: string;
  contactId: string;
  premisesId: string;
  relationshipType: RelationshipType;
}

export const MAILBOX = "alex.morgan@company.co.uk";
export const SCAN_RANGE = { from: "2026-03-07", to: "2026-03-14" };

export const PROPERTIES: Property[] = [
  { id: "p-oak", name: "Oak House", address: "1 Oak Street, London", postcode: "SE1 2AB" },
  { id: "p-riv", name: "Riverside Court", address: "20 Riverside Way, Manchester", postcode: "M3 4CD" },
  { id: "p-map", name: "Maple Gardens", address: "8 Maple Road, Birmingham", postcode: "B15 3EF" },
  { id: "p-har", name: "Harbour View Apartments", address: "14 Quayside Road, Bristol", postcode: "BS1 5QR" },
];

const units: Record<string, string[]> = {
  "p-oak": ["Flat 1", "Flat 2", "Flat 6", "Flat 12"],
  "p-riv": ["Apartment 3", "Apartment 7", "Apartment 14", "Apartment 21"],
  "p-map": ["Flat 1A", "Flat 3B", "Flat 8", "Flat 11"],
  "p-har": ["Apartment 2", "Apartment 9", "Apartment 16"],
};

export const PREMISES: Premises[] = PROPERTIES.flatMap((p) =>
  (units[p.id] ?? []).map((u) => ({
    id: `${p.id}-${u.replace(/\s+/g, "").toLowerCase()}`,
    propertyId: p.id,
    name: u,
    fullAddress: `${u}, ${p.name}, ${p.address}, ${p.postcode}`,
  })),
);

export const premisesId = (propertyId: string, unit: string) =>
  `${propertyId}-${unit.replace(/\s+/g, "").toLowerCase()}`;

export const DYNAMICS_CONTACTS: DynamicsContact[] = [
  { id: "DYN-C-10021", firstName: "Martin", lastName: "Lee", emailAddress: "martin.lee@email.com", relatedPremises: "Oak House, Flat 2", relationshipType: "Owner", contactType: "Customer" },
  { id: "DYN-C-10034", firstName: "Helen", lastName: "Smith", emailAddress: "helen.smith@email.com", relatedPremises: "Riverside Court, Apartment 14", relationshipType: "Owner", contactType: "Customer" },
  { id: "DYN-C-10047", firstName: "Aisha", lastName: "Patel", emailAddress: "aisha.patel@email.com", relatedPremises: "Maple Gardens, Flat 8", relationshipType: "Sub-Tenant", contactType: "Customer" },
  { id: "DYN-C-10052", firstName: "Tom", lastName: "Reynolds", emailAddress: "tom.reynolds@apexelectrical.co.uk", relatedPremises: "Apex Electrical Ltd — approved contractor", contactType: "Contractor" },
  { id: "DYN-C-10068", firstName: "Priya", lastName: "Shah", emailAddress: "priya.shah@rooflinerepairs.co.uk", relatedPremises: "Roofline Repairs — approved contractor", contactType: "Contractor" },
  { id: "DYN-C-10073", firstName: "Gareth", lastName: "Evans", emailAddress: "gareth.evans@company.co.uk", relatedPremises: "Colleague — Health & Safety", contactType: "Colleague" },
  { id: "DYN-C-10089", firstName: "Chloe", lastName: "Bennett", emailAddress: "chloe.bennett@company.co.uk", relatedPremises: "Colleague — Accounts", contactType: "Colleague" },
];

type Seed = [string, string, string, string, EmailCategory, string];

const seeds: Seed[] = [
  // A. New customers
  ["Sarah Jones", "sarah.jones@email.com", "Service charge query — Flat 12, Oak House", "2026-03-13T09:30", "NewCustomer",
    "Dear Alex,\n\nI am the leaseholder of Flat 12 at Oak House and have just received the half-yearly service charge demand. The amount for communal electricity looks noticeably higher than last year's budget.\n\nCould you please send me a breakdown of the electricity costs and confirm whether this reflects the new supply contract?\n\nMany thanks,\n\nSarah Jones\nFlat 12, Oak House\n07700 900412"],
  ["Daniel Wright", "daniel.wright@email.com", "Communal entrance door not closing — Apartment 7", "2026-03-12T18:05", "NewCustomer",
    "Hi Alex,\n\nI rent Apartment 7 at Riverside Court. For the past three days the main communal entrance door hasn't been closing properly — it stays slightly open unless you pull it shut by hand, which is a security concern.\n\nWould you be able to arrange for someone to look at the closer?\n\nThanks,\nDaniel Wright"],
  ["Greenfield Lettings", "lettings@greenfieldagents.co.uk", "Tenant change notification — Flat 3B, Maple Gardens", "2026-03-12T11:20", "NewCustomer",
    "Dear Alex,\n\nWe act on behalf of the landlord of Flat 3B, Maple Gardens. Please be advised that the current tenancy ends on 31 March 2026 and a new tenant will move in on 4 April 2026.\n\nPlease can you let us know if the building requires any move-in notice or booking of the lift for removals.\n\nKind regards,\n\nRebecca Hale\nProperty Manager\nGreenfield Lettings\n42 Harborne Road, Birmingham, B15 3HE\n0121 496 0321"],
  ["Emma Brown", "emma.brown@email.com", "Question about parking permits", "2026-03-11T20:45", "NewCustomer",
    "Hello,\n\nI've recently moved into my flat at Maple Gardens and wondered how I apply for a parking permit for the rear car park. Is there a form, and is there a charge?\n\nThank you,\nEmma Brown"],
  ["James Wilson", "jameswilson@email.com", "Building insurance certificate", "2026-03-11T08:15", "NewCustomer",
    "Dear Alex,\n\nI'm an owner at Oak House and my mortgage lender has asked for a copy of the current buildings insurance certificate and schedule. Could you email these over at your earliest convenience?\n\nBest regards,\nJames Wilson"],
  ["Sophie Ahmed", "s.ahmed@email.com", "Water leak affecting Flat 11", "2026-03-10T07:52", "NewCustomer",
    "Hi,\n\nMy name is Sophie Ahmed and I am the tenant in Flat 11, Maple Gardens. Water is coming through the bathroom ceiling, which I think is from the flat above. It started overnight and is getting worse.\n\nCould you please arrange an urgent inspection?\n\nThanks,\nS. Ahmed\n07700 900781"],
  ["Oliver Grant", "oliver.grant@email.com", "AGM attendance — Harbour View Apartments", "2026-03-09T14:10", "NewCustomer",
    "Dear Alex,\n\nAs the leaseholder of Apartment 16 at Harbour View Apartments, I'd like to confirm I will attend the AGM on 26 March. Could you also send the draft agenda and last year's minutes?\n\nKind regards,\nOliver Grant"],
  ["Nina Kapoor", "nina.kapoor@email.com", "Update my contact details", "2026-03-08T16:40", "NewCustomer",
    "Hi Alex,\n\nPlease update your records for my flat at Riverside Court. My new mobile number is 07700 900256 and I'd prefer all correspondence by email from now on.\n\nThanks,\nNina Kapoor"],
  // B. Existing
  ["Martin Lee", "martin.lee@email.com", "Lift service-charge query — Flat 2, Oak House", "2026-03-13T12:05", "ExistingCustomer",
    "Hi Alex,\n\nI've noticed the lift maintenance line on the service charge has gone up by nearly 30%. As I'm on the ground floor I rarely use it — could you explain the increase?\n\nThanks,\nMartin Lee"],
  ["Helen Smith", "helen.smith@email.com", "Change of correspondence address", "2026-03-12T10:30", "ExistingCustomer",
    "Dear Alex,\n\nPlease note my correspondence address has changed to 5 Lindley Close, Stockport, SK4 2JP, effective immediately. My apartment at Riverside Court is unchanged.\n\nKind regards,\nHelen Smith"],
  ["Aisha Patel", "aisha.patel@email.com", "Repair update — Flat 8, Maple Gardens", "2026-03-11T13:22", "ExistingCustomer",
    "Hi,\n\nI reported a faulty hallway light outside Flat 8 about two weeks ago. Could you let me know when the electrician is due?\n\nThanks,\nAisha Patel"],
  ["Tom Reynolds", "tom.reynolds@apexelectrical.co.uk", "Emergency lighting test — Oak House", "2026-03-10T09:48", "ExistingCustomer",
    "Dear Alex,\n\nWe completed the annual emergency lighting duration test at Oak House today. Three fittings on the second-floor landing failed and need new batteries. Please can you raise a PO so we can return next week?\n\nRegards,\nTom Reynolds\nApex Electrical Ltd"],
  ["Priya Shah", "priya.shah@rooflinerepairs.co.uk", "Gutter clearance quote — Harbour View", "2026-03-09T19:15", "ExistingCustomer",
    "Hi Alex,\n\nFollowing our inspection at Harbour View Apartments, the rear gutters are blocked and causing overflow onto the balconies. Our quote for clearance and a downpipe repair is £640 + VAT.\n\nThanks,\nPriya Shah\nRoofline Repairs"],
  ["Gareth Evans", "gareth.evans@company.co.uk", "Riverside Court site visit notes", "2026-03-08T23:10", "ExistingCustomer",
    "Hi Alex,\n\nNotes from today's Riverside Court visit: bin store door needs a new closer and there's a trip hazard by the car park gate. I've logged both in the H&S tracker.\n\nGareth"],
  ["Chloe Bennett", "chloe.bennett@company.co.uk", "Maple Gardens budget sign-off", "2026-03-07T15:35", "ExistingCustomer",
    "Hi Alex,\n\nCould you sign off the draft 2026/27 service charge budget for Maple Gardens by Thursday? The spreadsheet is on the shared drive.\n\nThanks,\nChloe\nAccounts"],
  // C. Suppliers
  ["BuildCo Maintenance", "scheduler@buildco.co.uk", "Quote for communal decoration works — Oak House", "2026-03-13T08:00", "Supplier",
    "Dear Alex,\n\nPlease find our quotation for redecoration of the communal hallways and stairwells at Oak House: £8,450 + VAT. Works scope includes preparation, two coats emulsion and gloss to skirtings. We can schedule a start from 6 April.\n\nBuildCo Maintenance Scheduling Team"],
  ["Lift Services Ltd", "service@liftservices.co.uk", "Planned maintenance visit — Riverside Court lift", "2026-03-12T07:30", "Supplier",
    "Hello,\n\nOur engineer will attend Riverside Court on 18 March between 09:00 and 12:00 for the quarterly planned maintenance visit. The lift will be out of service for approximately two hours.\n\nLift Services Ltd"],
  ["ClearView Fire Safety", "inspections@clearviewfiresafety.co.uk", "Fire alarm test report — Maple Gardens", "2026-03-11T16:00", "Supplier",
    "Dear Alex,\n\nAttached is the fire alarm test report for Maple Gardens. Two call points on the second floor require replacement. Please confirm approval to proceed with the remedial action.\n\nClearView Fire Safety Inspections"],
  ["AquaSafe Water Hygiene", "engineers@aquasafewater.co.uk", "Legionella monitoring visit completed", "2026-03-10T15:20", "Supplier",
    "Hi Alex,\n\nThe monthly legionella temperature monitoring visit at Harbour View Apartments is complete. All outlets were within range. The full report will follow within five working days.\n\nAquaSafe Engineers"],
  ["BrightClean Services", "accounts@brightcleaningcontractor.co.uk", "Invoice BC-10498 — communal cleaning", "2026-03-10T10:00", "Supplier",
    "Please find attached invoice BC-10498 for communal cleaning at Oak House and Riverside Court for February 2026. Total due: £1,240.00. Payment terms 30 days.\n\nBrightClean Accounts"],
  ["SecureEntry Systems", "support@secureentry.co.uk", "Door entry system fault report", "2026-03-09T11:45", "Supplier",
    "Dear Alex,\n\nOur engineer attended Harbour View Apartments and identified a failed power supply unit on the access-control panel. A replacement part has been ordered and a return visit will be booked.\n\nSecureEntry Support"],
  ["GreenScape Grounds", "operations@greenscape.co.uk", "Spring landscaping schedule", "2026-03-08T09:00", "Supplier",
    "Hi Alex,\n\nAttached is our spring grounds-maintenance programme for all four sites, including hedge cutting, lawn treatment and seasonal planting from April.\n\nGreenScape Operations"],
  ["Citywide Waste", "collections@citywidewaste.co.uk", "Missed bin collection report", "2026-03-07T13:30", "Supplier",
    "Dear Customer,\n\nWe've logged a missed recycling collection at Maple Gardens on 6 March. A crew will return within 48 hours.\n\nCitywide Waste Collections"],
  // D. Internal / automated / newsletter / spam
  ["Sophie Harris", "sophie.harris@company.co.uk", "Re: Oak House resident query", "2026-03-13T14:20", "Internal",
    "Hi Alex,\n\nJust checking whether you managed to reply to the Oak House resident about the electricity costs? Let me know if you need the supplier contract.\n\nThanks,\nSophie"],
  ["Service Charges Team", "servicecharges@company.co.uk", "Arrears report available for review", "2026-03-12T08:30", "Internal",
    "Hi Alex,\n\nThe March arrears report for your portfolio is now available on the shared drive. Please review and flag any accounts for escalation by Friday.\n\nService Charges Team"],
  ["Compliance Team", "compliance@company.co.uk", "FRA action tracker — March update", "2026-03-11T09:10", "Internal",
    "Hi all,\n\nThe fire risk assessment action tracker has been updated for March. Please close off any outstanding medium-priority actions before month end.\n\nCompliance"],
  ["Building Portal", "noreply@buildingportal.co.uk", "New maintenance request submitted", "2026-03-10T06:15", "Automated",
    "A new maintenance request (#MR-55821) has been submitted for Riverside Court. Category: Communal lighting. This is an automated message — please do not reply."],
  ["DocuSign", "no-reply@docusign.net", "Please sign: Contractor appointment form", "2026-03-09T10:05", "Automated",
    "Compliance Team sent you a document to review and sign: Contractor appointment form — GreenScape Grounds. Review document."],
  ["ARMA", "news@arma.org.uk", "This month’s residential management update", "2026-03-08T07:00", "Newsletter",
    "In this issue: Building Safety Act updates, service charge transparency guidance, and upcoming regional training dates."],
  ["Energy Broker", "marketing@energybroker.example", "Reduce your communal energy costs by 40%", "2026-03-07T12:00", "Spam",
    "Are you paying too much for communal energy? Our brokers can cut your costs by up to 40%. Book a free call today!"],
];

// Sent after the scan window so the invitation is not included in its own scan.
export const SYNC_INVITATION: EmailMessage = {
  id: "contact-sync-invitation",
  mailboxId: MAILBOX,
  senderName: "Contact Capture",
  senderEmail: "noreply@company.co.uk",
  recipientEmail: MAILBOX,
  subject: "Your contacts are ready to review and sync",
  body: "Hi Alex,\n\nYour latest inbox scan has found 8 potential new customer contacts. Review their details and choose which ones to add to Dynamics.\n\nUse your personal link below to open your contact sync page.",
  receivedAt: "2026-03-16T09:00",
  category: "Automated",
  processedStatus: "Unprocessed",
};

export const INBOX: EmailMessage[] = [SYNC_INVITATION, ...seeds.map(([senderName, senderEmail, subject, receivedAt, category, body], i): EmailMessage => ({
  id: `msg-${String(i + 1).padStart(3, "0")}`,
  mailboxId: MAILBOX,
  senderName,
  senderEmail,
  recipientEmail: MAILBOX,
  subject,
  body,
  receivedAt,
  category,
  processedStatus: "Unprocessed",
}))];

// Suggested values that a real extraction step would produce from email content.
export const EXTRACTED_SUGGESTIONS: Record<
  string,
  { firstName: string; lastName: string; propertyId: string; unit: string; relationshipType: RelationshipType | "" }
> = {
  "sarah.jones@email.com": { firstName: "Sarah", lastName: "Jones", propertyId: "p-oak", unit: "Flat 12", relationshipType: "Owner" },
  "daniel.wright@email.com": { firstName: "Daniel", lastName: "Wright", propertyId: "p-riv", unit: "Apartment 7", relationshipType: "Sub-Tenant" },
  "lettings@greenfieldagents.co.uk": { firstName: "Greenfield", lastName: "Lettings", propertyId: "p-map", unit: "Flat 3B", relationshipType: "Letting Agent" },
  "emma.brown@email.com": { firstName: "Emma", lastName: "Brown", propertyId: "p-map", unit: "", relationshipType: "" },
  "jameswilson@email.com": { firstName: "James", lastName: "Wilson", propertyId: "p-oak", unit: "", relationshipType: "Owner" },
  "s.ahmed@email.com": { firstName: "S", lastName: "Ahmed", propertyId: "p-map", unit: "Flat 11", relationshipType: "Sub-Tenant" },
  "oliver.grant@email.com": { firstName: "Oliver", lastName: "Grant", propertyId: "p-har", unit: "Apartment 16", relationshipType: "Owner" },
  "nina.kapoor@email.com": { firstName: "Nina", lastName: "Kapoor", propertyId: "p-riv", unit: "", relationshipType: "" },
};

export function formatUkDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}
