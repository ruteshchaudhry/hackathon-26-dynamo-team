import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  EXTRACTED_SUGGESTIONS,
  INBOX,
  MAILBOX,
  PREMISES,
  PROPERTIES,
  RELATIONSHIP_TYPES,
  SCAN_RANGE,
  formatUkDateTime,
  premisesId,
  type DynamicsContact,
  type RelationshipType,
  type SuggestedContact,
} from "@/lib/mock-data";
import {
  getRecentInboxMessages,
  identifyPotentialCustomerEmails,
  markProcessed,
} from "@/lib/integrations/graph";
import {
  createContact,
  createPremisesRelationship,
  findContactByEmail,
  markLastAdded,
  simulateFailureFor,
} from "@/lib/integrations/dynamics";
import { Link } from "@tanstack/react-router";


type Field = "firstName" | "lastName" | "propertyId" | "premisesId" | "relationshipType";
const FIELD_LABELS: Record<Field, string> = {
  firstName: "first name",
  lastName: "last name",
  propertyId: "property",
  premisesId: "premises",
  relationshipType: "relationship",
};

function missingFields(r: SuggestedContact): Field[] {
  const m: Field[] = [];
  if (!r.firstName.trim()) m.push("firstName");
  if (!r.lastName.trim()) m.push("lastName");
  if (!r.propertyId) m.push("propertyId");
  if (!r.premisesId) m.push("premisesId");
  if (!r.relationshipType) m.push("relationshipType");
  return m;
}

function missingMessage(m: Field[]) {
  const names = m.map((f) => FIELD_LABELS[f]);
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names[0];
  const verb = m.every((f) => f === "firstName" || f === "lastName") ? "Enter" : "Select";
  return `${verb} a ${list} to add this contact.`;
}

const propName = (id: string) => PROPERTIES.find((p) => p.id === id)?.name ?? "";
const premName = (id: string) => PREMISES.find((p) => p.id === id)?.name ?? "";

interface AddedRecord {
  name: string;
  email: string;
  premises: string;
  relationship: RelationshipType;
  contactId: string;
  relationshipId: string;
}

export function WeeklyReview() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<SuggestedContact[]>([]);
  const [existing, setExisting] = useState<(DynamicsContact & { messageId: string })[]>([]);
  const [scanned, setScanned] = useState(0);
  const [excluded, setExcluded] = useState(0);
  const [added, setAdded] = useState<AddedRecord[]>([]);
  const [failures, setFailures] = useState<Record<string, string>>({});
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number } | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [simulateFail, setSimulateFail] = useState(false);

  const runScan = useCallback(async (skipEmails: string[] = []) => {
    setLoading(true);
    const messages = await getRecentInboxMessages(MAILBOX, SCAN_RANGE);
    const found: (DynamicsContact & { messageId: string })[] = [];
    const unmatched: typeof messages = [];
    for (const m of messages) {
      const match = await findContactByEmail(m.senderEmail);
      if (match) found.push({ ...match, messageId: m.id });
      else unmatched.push(m);
    }
    const { customers, excluded } = identifyPotentialCustomerEmails(unmatched);
    const next: SuggestedContact[] = [];
    for (const m of customers) {
      if (skipEmails.includes(m.senderEmail)) continue;
      const s = EXTRACTED_SUGGESTIONS[m.senderEmail];
      next.push({
        id: `sc-${m.id}`,
        emailMessageId: m.id,
        emailAddress: m.senderEmail,
        firstName: s?.firstName ?? "",
        lastName: s?.lastName ?? "",
        propertyId: s?.propertyId ?? "",
        premisesId: s?.unit ? premisesId(s.propertyId, s.unit) : "",
        relationshipType: s?.relationshipType ?? "",
        selected: false,
        status: "Ready",
      });
    }
    setScanned(messages.length);
    setExcluded(excluded.length);
    setExisting(found);
    setRows(next);
    setFailures({});
    setHighlight(new Set());
    setValidationMsg(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void runScan();
  }, [runScan]);

  const update = (id: string, patch: Partial<SuggestedContact>) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.id !== id) return r;
        const n = { ...r, ...patch };
        if (patch.propertyId !== undefined) {
          const p = PREMISES.find((x) => x.id === n.premisesId);
          if (!p || p.propertyId !== n.propertyId) n.premisesId = "";
        }
        return n;
      }),
    );

  const selectedRows = rows.filter((r) => r.selected);
  const validSelected = selectedRows.filter((r) => missingFields(r).length === 0);

  const onAddClick = () => {
    setResult(null);
    const invalid = selectedRows.filter((r) => missingFields(r).length > 0);
    setHighlight(new Set(invalid.map((r) => r.id)));
    if (invalid.length) {
      setValidationMsg(
        `${invalid.length} selected contact${invalid.length > 1 ? "s need" : " needs"} more information before ${invalid.length > 1 ? "they" : "it"} can be added to Dynamics.`,
      );
    } else setValidationMsg(null);
    if (validSelected.length) setConfirmOpen(true);
  };

  const confirmWrite = async () => {
    setWriting(true);
    simulateFailureFor(simulateFail ? validSelected[validSelected.length - 1]?.emailAddress ?? null : null);
    const newAdded: AddedRecord[] = [];
    const failed: Record<string, string> = {};
    const doneIds: string[] = [];
    for (const r of validSelected) {
      const c = await createContact(r);
      if (!c.ok) {
        failed[r.id] = "Could not add this contact to Dynamics. Please try again.";
        continue;
      }
      const rel = await createPremisesRelationship({
        contactId: c.id,
        premisesId: r.premisesId,
        relationshipType: r.relationshipType as RelationshipType,
        contact: {
          firstName: r.firstName,
          lastName: r.lastName,
          emailAddress: r.emailAddress,
          sourceMessageId: r.emailMessageId,
        },
      });
      if (!rel.ok) {
        failed[r.id] = "Could not add this contact to Dynamics. Please try again.";
        continue;
      }
      doneIds.push(r.id);
      newAdded.push({
        name: `${r.firstName} ${r.lastName}`,
        email: r.emailAddress,
        premises: `${propName(r.propertyId)}, ${premName(r.premisesId)}`,
        relationship: r.relationshipType as RelationshipType,
        contactId: c.id,
        relationshipId: rel.id,
      });
    }
    markProcessed(validSelected.filter((r) => doneIds.includes(r.id)).map((r) => r.emailMessageId));
    markLastAdded(newAdded.map((a) => a.contactId));
    setAdded((a) => [...newAdded, ...a]);
    setRows((rs) =>
      rs
        .filter((r) => !doneIds.includes(r.id))
        .map((r) => (failed[r.id] ? { ...r, selected: false, status: "Failed" } : r)),
    );
    setFailures((f) => {
      const n = { ...f };
      doneIds.forEach((id) => delete n[id]);
      return { ...n, ...failed };
    });
    setResult({ ok: newAdded.length, failed: Object.keys(failed).length });
    setSimulateFail(false);
    setWriting(false);
    setConfirmOpen(false);
  };

  const viewEmail = useMemo(() => INBOX.find((m) => m.id === viewId) ?? null, [viewId]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2 font-semibold tracking-tight">
              <Mail className="h-4 w-4" /> Contact Capture
            </div>
            <div className="text-xs opacity-80">{MAILBOX}</div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
          <section className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">Contact Capture</h1>
                <span className="rounded-full border border-warning/40 bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-foreground">
                  Demo mode — simulated Outlook and Dynamics data
                </span>
              </div>
              <p className="text-muted-foreground">
                Review potential new customer contacts identified from your inbox.
              </p>
              <p className="text-xs font-medium text-muted-foreground">Inbox scan: 7–14 March 2026</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Email content is used only to generate review suggestions. Contacts are added to Dynamics only after your approval.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  void runScan(added.map((a) => a.email));
                }}
                disabled={loading || writing}
              >
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh inbox scan
              </Button>
              <Button onClick={onAddClick} disabled={selectedRows.length === 0 || writing}>
                Add selected to Dynamics{selectedRows.length ? ` (${selectedRows.length})` : ""}
              </Button>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="emails scanned" value={scanned} />
            <Stat label="potential new contacts to review" value={rows.length} />
            <Stat label="existing Dynamics contacts found" value={existing.length} />
            <Stat
              label="emails excluded"
              value={excluded}
              help="Excluded emails include suppliers, contractors, colleagues, automated notifications, newsletters, and other non-customer correspondence."
            />
          </section>

          {result && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-md border px-4 py-3 text-sm",
                result.failed ? "border-destructive/30 bg-destructive/5" : "border-success/30 bg-success-soft",
              )}
            >
              {result.failed ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
              )}
              <div>
                {result.ok > 0 && (
                  <p className="font-medium">
                    {result.ok} contact{result.ok !== 1 && "s"} and {result.ok} premises relationship
                    {result.ok !== 1 && "s"} {result.ok !== 1 ? "were" : "was"} added to Dynamics.
                  </p>
                )}
                {result.failed > 0 && (
                  <p className="font-medium text-destructive">
                    {result.failed} contact{result.failed !== 1 && "s"} could not be added. See the highlighted row below.
                  </p>
                )}
              </div>
              {result.ok > 0 && (
                <Button asChild size="sm" className="ml-auto">
                  <Link to="/dynamics">View in Dynamics</Link>
                </Button>
              )}
            </div>
          )}

          {validationMsg && (
            <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning-soft px-4 py-3 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-warning" /> {validationMsg}
            </div>
          )}

          <section className="rounded-lg border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2 className="font-semibold">Weekly Contact Review</h2>
                <p className="text-xs text-muted-foreground">
                  Suggestions are based on recent inbox emails. Please check and amend the details before adding a contact to Dynamics.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="fail" checked={simulateFail} onCheckedChange={setSimulateFail} />
                <Label htmlFor="fail" className="text-xs text-muted-foreground">
                  Simulate one Dynamics failure
                </Label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead className="bg-muted text-left text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5">Email address</th>
                    <th className="px-2 py-2.5">First name</th>
                    <th className="px-2 py-2.5">Last name</th>
                    <th className="px-2 py-2.5">Property</th>
                    <th className="px-2 py-2.5">Premises</th>
                    <th className="px-2 py-2.5">Relationship</th>
                    <th className="relative w-12 px-4 py-2.5">
                      <span className="sr-only">Select</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Scanning inbox…
                      </td>
                    </tr>
                  )}
                  {!loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                        All suggestions reviewed. Nothing left to add this week.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    rows.map((r) => {
                      const missing = missingFields(r);
                      const hl = highlight.has(r.id) || (r.selected && missing.length > 0);
                      const bad = (f: Field) => hl && missing.includes(f);
                      const premOptions = PREMISES.filter((p) => p.propertyId === r.propertyId);
                      return (
                        <tr
                          key={r.id}
                          className={cn(
                            "border-t align-top",
                            failures[r.id] && "bg-destructive/5",
                            r.selected && !failures[r.id] && "bg-accent/50",
                          )}
                        >
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5 pt-1.5">
                              <span className="text-sm">{r.emailAddress}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    aria-label={`View email from ${r.emailAddress}`}
                                    onClick={() => setViewId(r.emailMessageId)}
                                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                  >
                                    <Mail className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>View email</TooltipContent>
                              </Tooltip>
                            </div>
                            {failures[r.id] && (
                              <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
                                <XCircle className="h-3.5 w-3.5" /> {failures[r.id]}
                              </p>
                            )}
                            {missing.length > 0 && (
                              <p className={cn("mt-1 text-xs", hl ? "font-medium text-warning" : "text-muted-foreground")}>
                                {missingMessage(missing)}
                              </p>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            <Input
                              aria-label="First name"
                              value={r.firstName}
                              onChange={(e) => update(r.id, { firstName: e.target.value })}
                              className={cn("h-8", bad("firstName") && "border-warning ring-1 ring-warning")}
                            />
                          </td>
                          <td className="px-2 py-2.5">
                            <Input
                              aria-label="Last name"
                              value={r.lastName}
                              onChange={(e) => update(r.id, { lastName: e.target.value })}
                              className={cn("h-8", bad("lastName") && "border-warning ring-1 ring-warning")}
                            />
                          </td>
                          <td className="px-2 py-2.5">
                            <PropertyPicker
                              value={r.propertyId}
                              invalid={bad("propertyId")}
                              onChange={(v) => update(r.id, { propertyId: v })}
                            />
                          </td>
                          <td className="px-2 py-2.5">
                            <NativeSelect
                              label="Premises"
                              value={r.premisesId}
                              invalid={bad("premisesId")}
                              disabled={!r.propertyId}
                              onChange={(v) => update(r.id, { premisesId: v })}
                              options={premOptions.map((p) => ({ value: p.id, label: p.name }))}
                            />
                          </td>
                          <td className="px-2 py-2.5">
                            <NativeSelect
                              label="Relationship"
                              value={r.relationshipType}
                              invalid={bad("relationshipType")}
                              onChange={(v) => update(r.id, { relationshipType: v as RelationshipType })}
                              options={RELATIONSHIP_TYPES.map((t) => ({ value: t, label: t }))}
                            />
                          </td>
                          <td className="px-4 py-2.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex pt-2">
                                  <Checkbox
                                    aria-label="Select to add to Dynamics"
                                    checked={r.selected}
                                    disabled={!r.selected && missing.length > 0}
                                    onCheckedChange={(c) => {
                                      update(r.id, { selected: c === true });
                                      setHighlight((h) => {
                                        const n = new Set(h);
                                        n.delete(r.id);
                                        return n;
                                      });
                                    }}
                                  />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {missing.length && !r.selected ? "Complete all fields to select" : "Select to add to Dynamics"}
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>

          <Collapsible className="rounded-lg border bg-card">
            <CollapsibleTrigger className="group flex w-full items-center justify-between px-4 py-3 text-left">
              <div>
                <h2 className="font-semibold">Existing contacts found</h2>
                <p className="text-xs text-muted-foreground">
                  {existing.length} email senders already exist in Dynamics and do not need to be added
                  {" "}({(["Customer", "Contractor", "Colleague"] as const)
                    .map((t) => [t, existing.filter((c) => c.contactType === t).length] as const)
                    .filter(([, n]) => n > 0)
                    .map(([t, n]) => `${n} ${t.toLowerCase()}${n > 1 ? "s" : ""}`)
                    .join(", ")}).
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SimpleTable
                head={["Email address", "Contact name", "Type", "Related premises / organisation", "Relationship", "Dynamics Contact ID", "Status"]}
                rows={existing.map((c) => [
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{c.emailAddress}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          aria-label={`View email from ${c.emailAddress}`}
                          onClick={() => setViewId(c.messageId)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>View email</TooltipContent>
                    </Tooltip>
                  </div>,
                  `${c.firstName} ${c.lastName}`,
                  <StatusPill tone="muted">{c.contactType}</StatusPill>,
                  c.relatedPremises,
                  c.relationshipType ?? "—",
                  <span className="font-mono text-xs">{c.id}</span>,
                  <StatusPill tone="muted">Already exists in Dynamics</StatusPill>,
                ])}
              />
            </CollapsibleContent>
          </Collapsible>

          {added.length > 0 && (
            <section className="rounded-lg border bg-card">
              <div className="border-b px-4 py-3">
                <h2 className="font-semibold">Added this week</h2>
              </div>
              <SimpleTable
                head={["Contact name", "Email address", "Premises", "Relationship", "Dynamics Contact ID", "Status"]}
                rows={added.map((a) => [
                  a.name,
                  <span className="text-sm">{a.email}</span>,
                  a.premises,
                  a.relationship,
                  <span className="font-mono text-xs" title={`Relationship ${a.relationshipId}`}>
                    {a.contactId}
                  </span>,
                  <StatusPill tone="success">Added to Dynamics</StatusPill>,
                ])}
              />
            </section>
          )}

          <div className="flex items-center justify-end gap-3 rounded-lg border bg-card px-4 py-3">
            <p className="mr-auto text-sm text-muted-foreground">
              {selectedRows.length
                ? `${selectedRows.length} contact${selectedRows.length > 1 ? "s" : ""} selected`
                : "Select contacts in the review table to add them to Dynamics."}
            </p>
            <Button onClick={onAddClick} disabled={selectedRows.length === 0 || writing}>
              Add selected to Dynamics{selectedRows.length ? ` (${selectedRows.length})` : ""}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Prototype · Outlook data via Microsoft Graph and Dynamics 365 CE via Dataverse are simulated.
          </p>
        </main>

        <Dialog open={!!viewEmail} onOpenChange={(o) => !o && setViewId(null)}>
          <DialogContent className="max-w-2xl">
            {viewEmail && (
              <>
                <DialogHeader>
                  <DialogTitle>{viewEmail.subject}</DialogTitle>
                  <DialogDescription asChild>
                    <dl className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-1 pt-2 text-xs">
                      <dt className="text-muted-foreground">From</dt>
                      <dd className="text-foreground">
                        {viewEmail.senderName} &lt;{viewEmail.senderEmail}&gt;
                      </dd>
                      <dt className="text-muted-foreground">To</dt>
                      <dd className="text-foreground">{viewEmail.recipientEmail}</dd>
                      <dt className="text-muted-foreground">Received</dt>
                      <dd className="text-foreground">{formatUkDateTime(viewEmail.receivedAt)}</dd>
                    </dl>
                  </DialogDescription>
                </DialogHeader>
                <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/50 p-4 text-sm leading-relaxed">
                  {viewEmail.body}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={confirmOpen} onOpenChange={(o) => !writing && setConfirmOpen(o)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add selected contacts to Dynamics?</DialogTitle>
              <DialogDescription>
                This will create {validSelected.length} contact{validSelected.length !== 1 && "s"} and{" "}
                {validSelected.length} premises relationship{validSelected.length !== 1 && "s"}.
              </DialogDescription>
            </DialogHeader>
            <ul className="max-h-[50vh] divide-y overflow-y-auto rounded-md border text-sm">
              {validSelected.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-4 px-3 py-2">
                  <div>
                    <p className="font-medium">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{r.emailAddress}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p>
                      {propName(r.propertyId)}, {premName(r.premisesId)}
                    </p>
                    <p className="text-muted-foreground">{r.relationshipType}</p>
                  </div>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={writing}>
                Cancel
              </Button>
              <Button onClick={confirmWrite} disabled={writing}>
                {writing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Adding to Dynamics…
                  </>
                ) : (
                  "Confirm and add to Dynamics"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function Stat({ label, value, help }: { label: string; value: number; help?: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums text-primary">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {help && <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{help}</p>}
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "success" | "muted"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "success" ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
      )}
    >
      {tone === "success" && <Check className="h-3 w-3" />}
      {children}
    </span>
  );
}

function SimpleTable({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto border-t">
      <table className="w-full min-w-[800px] text-sm">
        <thead className="bg-muted text-left text-xs font-medium text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NativeSelect({
  label,
  value,
  onChange,
  options,
  invalid,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  invalid?: boolean;
  disabled?: boolean;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 w-full rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        !value && "text-muted-foreground",
        invalid && "border-warning ring-1 ring-warning",
      )}
    >
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function PropertyPicker({
  value,
  onChange,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Property"
          className={cn(
            "flex h-8 w-full items-center justify-between gap-1 rounded-md border border-input bg-card px-2 text-left text-sm",
            !value && "text-muted-foreground",
            invalid && "border-warning ring-1 ring-warning",
          )}
        >
          <span className="truncate">{propName(value) || "Select…"}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search properties…" />
          <CommandList>
            <CommandEmpty>No property found.</CommandEmpty>
            <CommandGroup>
              {PROPERTIES.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.name} ${p.address} ${p.postcode}`}
                  onSelect={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("h-3.5 w-3.5", value === p.id ? "opacity-100" : "opacity-0")} />
                  <div>
                    <p>{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.address}, {p.postcode}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
