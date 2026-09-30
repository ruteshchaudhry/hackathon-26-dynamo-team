import { DYNAMICS_CONTACTS, EXTRACTED_SUGGESTIONS, INBOX, PREMISES, PROPERTIES, premisesId, type RelationshipType } from "./mock-data";

export const DAY = 86_400_000;
export type Candidate = {
  id: string; firstName: string; lastName: string; email: string; propertyId: string;
  premisesId: string; relationship: RelationshipType | ""; sourceId: string;
  kind: "contact" | "relationship"; contactId?: string; evidence: string;
  status: "pending" | "added" | "dismissed" | "later"; reason?: string;
  deferredUntil?: number; error?: string;
};
export type Contact = {
  id: string; firstName: string; lastName: string; email: string; type: string;
  relationships: { property: string; premises: string; type: string }[];
  new?: boolean; updated?: boolean;
};
export type ReviewState = {
  candidates: Candidate[]; contacts: Contact[]; now: number; lastNotice: number;
  notices: { date: number; count: number }[]; activity: { id: string; name: string; action: string; contactId: string }[];
};
export const propName = (id: string) => PROPERTIES.find(p => p.id === id)?.name ?? "";
export const premName = (id: string) => PREMISES.find(p => p.id === id)?.name ?? "";
export const fullName = (c: {firstName: string; lastName: string}) => [c.firstName, c.lastName].filter(Boolean).join(" ");
export const initialLetters = (name: string) => name.split(" ").map(w => w[0]).slice(0,2).join("");
export const formatDate = (n: number) => new Date(n).toLocaleDateString("en-GB", {day:"numeric",month:"long",timeZone:"UTC"});
export function missing(c: Candidate): string[] {
  return [!c.firstName.trim() && "first name", !c.lastName.trim() && "last name", !c.propertyId && "property",
    !c.premisesId && "premises", !c.relationship && "relationship"].filter(Boolean) as string[];
}
export const active = (c: Candidate, now: number) => c.status === "pending" || (c.status === "later" && (c.deferredUntil ?? Infinity) <= now);
export function seedState(): ReviewState {
  const evidence = [
    "I am the leaseholder of Flat 12 at Oak House",
    "I rent Apartment 7 at Riverside Court.",
    "We act on behalf of the landlord of Flat 3B, Maple Gardens.",
    "I've recently moved into my flat at Maple Gardens",
    "I'm an owner at Oak House",
    "My name is Sophie Ahmed and I am the tenant in Flat 11, Maple Gardens.",
    "Please update your records for my flat at Riverside Court.",
  ];
  const emails = Object.keys(EXTRACTED_SUGGESTIONS).filter(e => e !== "oliver.grant@email.com");
  const candidates: Candidate[] = emails.map((email,i) => {
    const s = EXTRACTED_SUGGESTIONS[email];
    return {id:email, email, firstName:email.startsWith("s.ahmed") ? "Sophie" : email.startsWith("lettings") ? "Rebecca" : s.firstName,
      lastName:email.startsWith("lettings") ? "Hale" : s.lastName, propertyId:s.propertyId,
      premisesId:s.unit ? premisesId(s.propertyId,s.unit) : "", relationship:s.relationshipType,
      sourceId:INBOX.find(m=>m.senderEmail===email)!.id, kind:"contact", evidence:evidence[i],status:"pending"};
  });
  candidates.push({id:"martin-new-premises",firstName:"Martin",lastName:"Lee",email:"martin.lee@email.com",
    propertyId:"p-oak",premisesId:premisesId("p-oak","Flat 6"),relationship:"Owner",sourceId:"martin-new",
    kind:"relationship",contactId:"DYN-C-10021",evidence:"I also own Flat 6 at Oak House. Please link this flat to my existing contact details.",status:"pending"});
  const now = Date.UTC(2026,2,16,9);
  return {candidates,contacts:DYNAMICS_CONTACTS.map(c=>({id:c.id,firstName:c.firstName,lastName:c.lastName,email:c.emailAddress,type:c.contactType,
    relationships:c.relationshipType?[{property:c.relatedPremises.split(", ")[0],premises:c.relatedPremises.split(", ")[1]??"",type:c.relationshipType}]:[]})),
    now,lastNotice:now,notices:[{date:now,count:candidates.length}],activity:[]};
}
export function sourceFor(c: Candidate) {
  if(c.sourceId==="martin-new") return {senderName:"Martin Lee",senderEmail:c.email,subject:"Additional property — Flat 6, Oak House",
    body:"Hi Alex,\n\nI also own Flat 6 at Oak House. Please link this flat to my existing contact details. I will continue to use this email address for both flats.\n\nMany thanks,\nMartin Lee",receivedAt:"2026-03-13T10:15"};
  return INBOX.find(m=>m.id===c.sourceId)!;
}

export function approve(state: ReviewState, ids: string[], failOne: boolean): {state: ReviewState; added: number; linked: number; failed: number} {
  const next = structuredClone(state);
  let added=0,linked=0,failed=0;
  const valid=next.candidates.filter(c=>ids.includes(c.id)&&active(c,next.now)&&missing(c).length===0);
  for(const c of valid) {
    if(failOne && c.id===valid.at(-1)?.id) { c.error="Couldn't save to Dynamics. Your details are safe. Try again."; failed++; continue; }
    let record=next.contacts.find(r=>r.email.toLowerCase()===c.email.toLowerCase());
    const existed=!!record;
    if(!record) {
      record={id:"DYN-C-"+(10120+next.contacts.length),firstName:c.firstName.trim(),lastName:c.lastName.trim(),email:c.email,type:"Customer",relationships:[],new:true};
      next.contacts.unshift(record); added++;
    }
    const rel={property:propName(c.propertyId),premises:premName(c.premisesId),type:c.relationship};
    if(!record.relationships.some(r=>r.property===rel.property&&r.premises===rel.premises&&r.type===rel.type)) {
      record.relationships.push(rel); if(existed) {linked++;record.updated=true;}
    }
    c.status="added";c.error=undefined;
    next.activity.unshift({id:c.id,name:fullName(c),action:existed?"Premises linked":"Contact added",contactId:record.id});
  }
  return {state:next,added,linked,failed};
}
export function advanceClock(state: ReviewState, days: number): {state: ReviewState; message: string} {
  const now=state.now+days*DAY;
  const pending=state.candidates.filter(c=>active(c,now));
  if(!pending.length) return {state:{...state,now},message:"No contacts to review. No reminder sent."};
  if(now-state.lastNotice<7*DAY) return {state:{...state,now},message:"No extra reminder. The next one is available from "+formatDate(state.lastNotice+7*DAY)+"."};
  return {state:{...state,now,lastNotice:now,notices:[{date:now,count:pending.length},...state.notices]},message:"One weekly reminder created in the demo inbox."};
}
