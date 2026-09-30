import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Archive,
  Calendar,
  File,
  Flag,
  Folder,
  Inbox,
  Mail,
  Reply,
  ReplyAll,
  ScanSearch,
  Search,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { MAILBOX } from "@/lib/mock-data";
import { markRead, useInbox } from "@/lib/integrations/graph";
import { cn } from "@/lib/utils";


function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function shortTime(iso: string) {
  // Deterministic formatting so server and browser render identical text.
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function OutlookInbox() {
  const messages = useInbox();
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return messages;
    return messages.filter(
      (m) => m.senderName.toLowerCase().includes(t) || m.subject.toLowerCase().includes(t) || m.senderEmail.includes(t),
    );
  }, [messages, q]);

  const selected = messages.find((m) => m.id === selectedId) ?? null;
  const unread = messages.filter((m) => !m.isRead).length;

  const open = (id: string) => {
    setSelectedId(id);
    markRead(id);
  };

  return (
    <div className="demo-surface outlook-surface flex h-[calc(100vh-2.5rem)] flex-col bg-background text-sm">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center gap-4 bg-outlook px-4 text-brand-foreground">
        <div className="flex items-center gap-2 font-semibold">
          <Mail className="h-5 w-5" /> Outlook
        </div>
        <div className="mx-auto flex w-full max-w-xl items-center gap-2 rounded bg-brand-foreground/90 px-3 py-1.5 text-foreground">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-foreground/20 text-xs font-semibold">
          AM
        </div>
      </header>

      {/* Ribbon */}
      <div className="outlook-ribbon flex shrink-0 items-center gap-1 border-b bg-card px-3 py-1.5">
        <button className="flex items-center gap-1.5 rounded bg-outlook px-3 py-1.5 font-medium text-brand-foreground">
          <Mail className="h-4 w-4" /> New mail
        </button>
        {[
          { i: Trash2, l: "Delete" },
          { i: Archive, l: "Archive" },
          { i: Reply, l: "Reply" },
          { i: ReplyAll, l: "Reply all" },
          { i: Flag, l: "Flag" },
        ].map(({ i: I, l }) => (
          <button key={l} className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-muted-foreground hover:bg-muted">
            <I className="h-4 w-4" /> {l}
          </button>
        ))}
        <Link
          to="/"
          className="ml-auto flex items-center gap-1.5 rounded border border-outlook px-3 py-1.5 font-medium text-outlook hover:bg-outlook-soft"
        >
          <ScanSearch className="h-4 w-4" /> Capture contacts
        </Link>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Rail + folders */}
        <nav className="hidden w-12 shrink-0 flex-col items-center gap-4 border-r bg-muted py-3 text-muted-foreground md:flex">
          <Mail className="h-5 w-5 text-outlook" />
          <Calendar className="h-5 w-5" />
          <Users className="h-5 w-5" />
        </nav>
        <aside className="hidden w-52 shrink-0 border-r bg-card p-2 lg:block">
          <p className="truncate px-2 py-1 text-xs font-semibold text-muted-foreground">{MAILBOX}</p>
          {[
            { i: Inbox, l: "Inbox", n: unread, active: true },
            { i: File, l: "Drafts" },
            { i: Send, l: "Sent Items" },
            { i: Trash2, l: "Deleted Items" },
            { i: Archive, l: "Archive" },
            { i: Folder, l: "Suppliers" },
            { i: Folder, l: "Residents" },
          ].map(({ i: I, l, n, active }) => (
            <div
              key={l}
              className={cn(
                "flex items-center gap-2 rounded px-2 py-1.5",
                active ? "bg-outlook-soft font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              <I className="h-4 w-4" /> {l}
              {!!n && <span className="ml-auto text-xs font-semibold text-outlook">{n}</span>}
            </div>
          ))}
        </aside>

        {/* Message list */}
        <section className={cn("outlook-list flex w-full max-w-md shrink-0 flex-col border-r bg-card", selected && "has-selection")}>
          <div className="flex items-center justify-between border-b px-4 py-2">
            <h1 className="font-semibold">Inbox</h1>
            <span className="text-xs text-muted-foreground">{filtered.length} messages</span>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {filtered.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() => open(m.id)}
                  className={cn(
                    "flex w-full gap-3 border-b border-l-4 px-3 py-2.5 text-left hover:bg-muted",
                    selectedId === m.id ? "border-l-outlook bg-outlook-soft" : m.isRead ? "border-l-transparent" : "border-l-outlook/60",
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {initials(m.senderName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={cn("truncate", !m.isRead && "font-semibold")}>{m.senderName}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{shortTime(m.receivedAt)}</span>
                    </div>
                    <div className={cn("truncate", !m.isRead ? "font-semibold text-outlook" : "text-foreground")}>
                      {m.subject}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-xs text-muted-foreground">{m.body.replace(/\s+/g, " ").slice(0, 90)}</span>
                      {m.processedStatus === "Processed" && (
                        <span className="shrink-0 rounded bg-success-soft px-1.5 text-[10px] font-medium text-success">
                          Captured
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="p-6 text-center text-muted-foreground">No messages found.</li>}
          </ul>
        </section>

        {/* Reading pane */}
        <section className={cn("outlook-reading hidden min-w-0 flex-1 overflow-y-auto bg-background p-6 md:block", selected && "has-selection")}>
          {selected && <button onClick={() => setSelectedId(null)} className="mb-3 rounded border bg-card px-3 py-2 md:hidden">Back to inbox</button>}
          {selected ? (
            <article className="rounded-md border bg-card p-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{selected.subject}</h2>
                {selected.processedStatus === "Processed" && (
                  <span className="rounded bg-success-soft px-2 py-0.5 text-xs font-medium text-success">Captured to Dynamics</span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3 border-b pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground">
                  {initials(selected.senderName)}
                </div>
                <div className="min-w-0">
                  <div className="font-medium">
                    {selected.senderName} <span className="font-normal text-muted-foreground">&lt;{selected.senderEmail}&gt;</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    To: {selected.recipientEmail} · {shortTime(selected.receivedAt)}
                  </div>
                </div>
              </div>
              <div className="whitespace-pre-line pt-4 leading-relaxed">{selected.body}</div>
              <div className="mt-6 flex gap-2">
                <button className="flex items-center gap-1.5 rounded border px-3 py-1.5 hover:bg-muted"><Reply className="h-4 w-4" /> Reply</button>
                <button className="flex items-center gap-1.5 rounded border px-3 py-1.5 hover:bg-muted"><ReplyAll className="h-4 w-4" /> Reply all</button>
              </div>
            </article>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Mail className="mb-2 h-10 w-10 opacity-40" />
              Select an item to read
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
