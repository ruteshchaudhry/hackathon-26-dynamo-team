import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Grid3x3,
  Home,
  Inbox,
  LayoutDashboard,
  Mail,
  MapPin,
  Menu,
  PenLine,
  Phone,
  Pin,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Share2,
  Shield,
  Sparkles,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { INBOX, formatUkDateTime } from "@/lib/mock-data";
import { useDynamicsContacts, type ListedContact } from "@/lib/integrations/dynamics";
import { cn } from "@/lib/utils";


const NAV: { group?: string; items: { i: typeof Home; l: string; active?: boolean }[] }[] = [
  { items: [{ i: Home, l: "Home" }, { i: Clock, l: "Recent" }, { i: Pin, l: "Pinned" }] },
  { group: "My Work", items: [{ i: LayoutDashboard, l: "Dashboards" }, { i: ClipboardList, l: "Cases" }, { i: Inbox, l: "Queues" }, { i: FileText, l: "Activities" }] },
  { group: "Customer Service", items: [{ i: Users, l: "My Customers" }, { i: Shield, l: "External Escalations" }] },
  { group: "Property Management", items: [{ i: Users, l: "Contacts", active: true }, { i: Building2, l: "Accounts (Clients)" }, { i: Building2, l: "Properties / Devel..." }, { i: MapPin, l: "Locations" }, { i: Home, l: "Premises" }] },
  { group: "External Links", items: [{ i: ExternalLink, l: "Reports Hub" }] },
];

const initials = (c: { firstName: string; lastName: string }) => `${c.firstName[0] ?? ""}${c.lastName[0] ?? ""}`.toUpperCase();
const ukDate = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export function DynamicsApp() {
  const { contacts, lastAddedIds } = useDynamicsContacts();
  const [openId, setOpenId] = useState<string | null>(null);
  const open = contacts.find((c) => c.id === openId) ?? null;

  return (
    <div className="demo-surface dynamics-surface flex h-[calc(100vh-2.5rem)] flex-col bg-muted text-sm">
      <header className="flex h-12 shrink-0 items-center gap-3 bg-dynamics px-3 text-brand-foreground">
        <Grid3x3 className="h-5 w-5" />
        <span className="text-lg font-semibold tracking-wide">RENDALL &amp; RITTNER</span>
        <span className="border-l border-brand-foreground/40 pl-3">Case Management</span>
        <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded bg-brand-foreground px-3 py-1.5 text-muted-foreground">
          <Search className="h-4 w-4" /> Search
        </div>
        <Plus className="h-5 w-5" />
        <Bell className="h-5 w-5" />
        <Settings className="h-5 w-5" />
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-foreground/25 text-xs font-semibold">SS</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="hidden w-52 shrink-0 overflow-y-auto border-r bg-card py-2 md:block">
          <Menu className="mx-3 mb-2 h-4 w-4 text-muted-foreground" />
          {NAV.map((g, gi) => (
            <div key={gi} className="mb-2">
              {g.group && <p className="px-3 py-1.5 font-semibold">{g.group}</p>}
              {g.items.map(({ i: I, l, active }) => (
                <button
                  key={l}
                  onClick={() => active && setOpenId(null)}
                  className={cn(
                    "flex w-full items-center gap-2 border-l-4 px-3 py-1.5 text-left",
                    active ? "border-l-dynamics bg-dynamics-soft font-medium" : "border-l-transparent text-muted-foreground hover:bg-muted",
                  )}
                >
                  <I className="h-4 w-4" /> {l}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <main className="min-w-0 flex-1 overflow-y-auto p-3">
          {open ? (
            <ContactRecord c={open} onBack={() => setOpenId(null)} />
          ) : (
            <ContactList contacts={contacts} highlight={lastAddedIds} onOpen={setOpenId} />
          )}
        </main>
      </div>
    </div>
  );
}

function CommandBar({ items, onBack }: { items: { i: typeof Save; l: string }[]; onBack?: () => void }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-1 rounded-md bg-card px-2 py-1.5 shadow-sm">
      {onBack && (
        <button onClick={onBack} className="rounded p-1.5 hover:bg-muted" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      {items.map(({ i: I, l }) => (
        <button key={l} className="flex items-center gap-1.5 rounded px-2.5 py-1.5 hover:bg-muted">
          <I className="h-4 w-4 text-dynamics" /> {l}
        </button>
      ))}
    </div>
  );
}

function ContactList({
  contacts,
  highlight,
  onOpen,
}: {
  contacts: ListedContact[];
  highlight: string[];
  onOpen: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"All" | ListedContact["contactType"]>("All");
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return contacts.filter(
      (c) =>
        (type === "All" || c.contactType === type) &&
        (!t || `${c.firstName} ${c.lastName} ${c.emailAddress} ${c.relatedPremises}`.toLowerCase().includes(t)),
    );
  }, [contacts, q, type]);
  const newCount = contacts.filter((c) => c.isNew).length;

  return (
    <>
      <CommandBar items={[{ i: Plus, l: "New" }, { i: Trash2, l: "Delete" }, { i: RefreshCw, l: "Refresh" }, { i: Share2, l: "Share" }]} />
      <div className="rounded-md bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-3 border-b px-4 py-3">
          <h1 className="flex items-center gap-1 text-lg font-semibold">
            Active Contacts <ChevronDown className="h-4 w-4" />
          </h1>
          {newCount > 0 && (
            <span className="rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
              {newCount} added by Contact Capture
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="rounded border bg-background px-2 py-1.5"
              aria-label="Contact type"
            >
              {["All", "Customer", "Contractor", "Colleague"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 rounded border px-2 py-1.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by keyword" className="bg-transparent outline-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                {["Full Name", "Email", "Related Premises", "Relationship", "Contact Type", "Created On"].map((h) => (
                  <th key={h} className="px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={cn("border-b hover:bg-muted", highlight.includes(c.id) && "bg-success-soft")}>
                  <td className="px-4 py-2">
                    <button onClick={() => onOpen(c.id)} className="text-dynamics underline-offset-2 hover:underline">
                      {c.firstName} {c.lastName}
                    </button>
                    {c.isNew && <span className="ml-2 rounded bg-success px-1.5 text-[10px] font-semibold text-brand-foreground">NEW</span>}
                  </td>
                  <td className="px-4 py-2">{c.emailAddress}</td>
                  <td className="px-4 py-2">{c.relatedPremises}</td>
                  <td className="px-4 py-2">{c.relationshipType ?? "—"}</td>
                  <td className="px-4 py-2">{c.contactType}</td>
                  <td className="px-4 py-2 text-muted-foreground">{ukDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-2 text-xs text-muted-foreground">Rows: {rows.length}</p>
      </div>
    </>
  );
}

function Field({ label, value, icon: I }: { label: string; value?: string; icon?: typeof Mail }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] items-center gap-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center justify-between gap-2 rounded bg-muted px-3 py-1.5">
        <span className={cn("truncate", !value && "text-muted-foreground")}>{value || "---"}</span>
        {I && <I className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-md bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function ContactRecord({ c, onBack }: { c: ListedContact; onBack: () => void }) {
  const source = INBOX.find((m) => m.id === c.sourceMessageId) ?? INBOX.find((m) => m.senderEmail === c.emailAddress);
  const [tab, setTab] = useState("Summary");
  const premisesParts = c.relatedPremises.split(", ");
  const unit = premisesParts[1] ?? premisesParts[0] ?? "";
  const building = premisesParts[1] ? premisesParts[0] : "";

  return (
    <>
      <CommandBar
        onBack={onBack}
        items={[
          { i: Save, l: "Save" },
          { i: Save, l: "Save & Close" },
          { i: Plus, l: "New" },
          { i: UserMinus, l: "Deactivate" },
          { i: UserCheck, l: "Assign" },
          { i: Trash2, l: "Delete" },
          { i: RefreshCw, l: "Refresh" },
          { i: Share2, l: "Share" },
        ]}
      />
      <div className="mb-3 rounded-md bg-card px-4 pt-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dynamics-soft font-semibold text-dynamics">{initials(c)}</span>
          <div>
            <h1 className="text-lg font-semibold">
              {c.firstName} {c.lastName} <span className="text-sm font-normal text-muted-foreground">- Saved</span>
            </h1>
            <p className="text-muted-foreground">Contact</p>
          </div>
          {c.isNew && (
            <span className="ml-3 mt-1 flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
              <Sparkles className="h-3 w-3" /> Created by Contact Capture
            </span>
          )}
          <div className="ml-auto flex items-center gap-2 text-right">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold">AM</span>
            <div>
              <p className="font-medium text-dynamics">Alex Morgan</p>
              <p className="text-xs text-muted-foreground">Owner</p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-5">
          {["Summary", "Messages", "Premises", "Files", "Related"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("border-b-2 pb-2", tab === t ? "border-dynamics font-semibold" : "border-transparent text-muted-foreground")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab !== "Summary" ? (
        <div className="rounded-md bg-card p-10 text-center text-muted-foreground shadow-sm">This tab is not part of the prototype.</div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-3">
          <div className="space-y-3">
            <Card title="Contact Information">
              <Field label="VIP" value="No" />
              <Field label="First Name" value={c.firstName} />
              <Field label="Last Name" value={c.lastName} />
              <Field label="Primary Email Address" value={c.emailAddress} icon={Mail} />
              <Field label="Email Address 2" />
              <Field label="Main Phone" icon={Phone} />
              <Field label="Mobile Phone" icon={Phone} />
              <Field label="Contact Type" value={c.contactType} />
            </Card>
            {c.relationshipType && (
              <Card title="Active Premises">
                <div className="flex items-center gap-3 rounded border p-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dynamics text-xs font-semibold text-brand-foreground">
                    {unit.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                  </span>
                  <div>
                    <p className="font-medium">{unit}{building && `, ${building}`}</p>
                    <p className="text-xs text-muted-foreground">{c.relationshipType}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <Card title="Timeline" action={<Plus className="h-4 w-4 text-muted-foreground" />}>
            <div className="mb-2 flex items-center gap-2 rounded bg-muted px-3 py-1.5 text-muted-foreground">
              <Search className="h-4 w-4" /> Search timeline
            </div>
            <div className="mb-3 flex items-center gap-2 border-b px-1 pb-2 text-muted-foreground">
              <PenLine className="h-4 w-4" /> Enter a note...
            </div>
            <ul className="space-y-3">
              {c.isNew && (
                <li className="rounded border p-3">
                  <p className="text-xs text-muted-foreground">Created on: {ukDate(c.createdAt)}</p>
                  <p className="mt-1 flex items-center gap-1.5"><FileText className="h-4 w-4 text-dynamics" /> Note: Created by Contact Capture</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Contact and premises relationship ({c.relationshipType}) created after review by Alex Morgan.
                  </p>
                </li>
              )}
              {source ? (
                <li className="rounded border p-3">
                  <p className="text-xs text-muted-foreground">Created on: {formatUkDateTime(source.receivedAt)}</p>
                  <p className="mt-1 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-dynamics" /> Email from: {source.senderName}
                    <span className="rounded bg-muted px-1.5 text-xs">Active</span>
                  </p>
                  <p className="mt-1 font-medium">{source.subject}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-muted-foreground">{source.body}</p>
                </li>
              ) : (
                <li className="text-muted-foreground">No timeline activity.</li>
              )}
            </ul>
          </Card>

          <div className="space-y-3">
            <Card title="Cases" action={<span className="flex items-center gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> New Case</span>}>
              {source && c.contactType === "Customer" && !c.isNew ? (
                <table className="w-full text-left">
                  <thead className="text-muted-foreground"><tr><th className="py-1 font-medium">Case Title</th><th className="font-medium">Status</th><th className="font-medium">Received On</th></tr></thead>
                  <tbody><tr className="border-t"><td className="py-1.5 text-dynamics">{source.subject.split(" — ")[0]}</td><td>Active</td><td>{new Date(source.receivedAt).toLocaleDateString("en-GB")}</td></tr></tbody>
                </table>
              ) : (
                <p className="text-muted-foreground">No cases yet.</p>
              )}
            </Card>
            <Card title="All Relationships">
              {c.relationshipType ? (
                <table className="w-full text-left">
                  <thead className="text-muted-foreground"><tr><th className="py-1 pr-3 font-medium">Status</th><th className="pr-3 font-medium">Premises</th><th className="font-medium">Relationship</th></tr></thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="py-1.5 pr-3">Active</td>
                      <td className="pr-3 text-dynamics">{c.relatedPremises}</td>
                      <td className="text-dynamics">{c.relationshipType}</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-muted-foreground">No premises relationships.</p>
              )}
              {c.relationshipId && <p className="mt-2 font-mono text-xs text-muted-foreground">{c.relationshipId}</p>}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
