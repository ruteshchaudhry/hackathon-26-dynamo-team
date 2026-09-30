/**
 * Outlook / Microsoft Graph adapter — PROTOTYPE PLACEHOLDER.
 *
 * A real implementation would call the Microsoft Graph API from the server
 * (e.g. GET /users/{mailboxId}/mailFolders/inbox/messages with a
 * receivedDateTime filter) using delegated permission Mail.Read for the
 * signed-in Property Manager. No live Microsoft credentials are used here.
 */
import { INBOX, type EmailMessage } from "@/lib/mock-data";
import { setDemoState, useDemoState } from "@/lib/demo-store";

const INTERNAL_DOMAIN = "@company.co.uk";
const SUPPLIER_DOMAINS = [
  "@buildco.co.uk",
  "@liftservices.co.uk",
  "@clearviewfiresafety.co.uk",
  "@aquasafewater.co.uk",
  "@brightcleaningcontractor.co.uk",
  "@secureentry.co.uk",
  "@greenscape.co.uk",
  "@citywidewaste.co.uk",
];
const AUTOMATED_PREFIXES = ["noreply@", "no-reply@", "news@", "marketing@"];

export async function getRecentInboxMessages(
  mailboxId: string,
  dateRange: { from: string; to: string },
): Promise<EmailMessage[]> {
  // Real: Graph $filter=receivedDateTime ge {from} and receivedDateTime le {to}
  return INBOX.filter(
    (m) =>
      m.mailboxId === mailboxId &&
      m.receivedAt >= dateRange.from &&
      m.receivedAt <= `${dateRange.to}T23:59`,
  );
}

export function isExcludedSender(email: string) {
  const e = email.toLowerCase();
  return (
    e.endsWith(INTERNAL_DOMAIN) ||
    SUPPLIER_DOMAINS.some((d) => e.endsWith(d)) ||
    AUTOMATED_PREFIXES.some((p) => e.startsWith(p))
  );
}

export function identifyPotentialCustomerEmails(messages: EmailMessage[]) {
  const customers = messages.filter((m) => !isExcludedSender(m.senderEmail));
  const excluded = messages.filter((m) => isExcludedSender(m.senderEmail));
  return { customers, excluded };
}

export async function getMessageById(messageId: string) {
  // Real: GET /users/{mailboxId}/messages/{messageId}
  return INBOX.find((m) => m.id === messageId) ?? null;
}

/** React hook: full inbox (newest first) with read/processed flags from the demo store. */
export function useInbox() {
  const s = useDemoState();
  const messages = [...INBOX]
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .map((m) => ({
      ...m,
      isRead: s.readMessageIds.includes(m.id),
      processedStatus: (s.processedMessageIds.includes(m.id) ? "Processed" : "Unprocessed") as EmailMessage["processedStatus"],
    }));
  return messages;
}

export function markRead(messageId: string) {
  // Real: PATCH /users/{mailboxId}/messages/{id} { isRead: true }
  setDemoState((s) =>
    s.readMessageIds.includes(messageId) ? s : { ...s, readMessageIds: [...s.readMessageIds, messageId] },
  );
}

export function markProcessed(messageIds: string[]) {
  // Real: apply an Outlook category "Captured" to the message
  setDemoState((s) => ({
    ...s,
    processedMessageIds: Array.from(new Set([...s.processedMessageIds, ...messageIds])),
  }));
}

