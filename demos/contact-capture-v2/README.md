# Contact Capture V2 — Embedded review

A separate interactive prototype of a lower-friction contact review, presented inside simulated Outlook and Dynamics screens. The original demo is unchanged.

## Run

Requires Node.js 22.12+ and pnpm.

```sh
pnpm install --frozen-lockfile
pnpm dev --port 5174
```

Run `pnpm build` for a static production build in `dist/`; `pnpm preview` previews that build.

## Walkthrough

1. Open the weekly email and choose **Review 8 suggestions**.
2. Review five ready suggestions. **Why this suggestion?** shows evidence and the source email. Four are new contacts; Martin Lee adds another premises relationship to an existing contact.
3. Approve the selected suggestions in one action. Switch to **Dynamics** to inspect the records and relationships. Both screens share the same review queue.
4. Complete the three **Needs input** suggestions. Completed suggestions move to **Ready to add**. Edits are retained while navigating within the demo.
5. Each suggestion's menu supports **Review later**, **Not a customer**, and **Already handled**. History supports restoring suggestions and viewing saved records.
6. **Demo controls** can advance the simulated clock. There is at most one reminder per seven days across both screens, and none when there are no pending suggestions.
7. Enable **Fail one suggestion in the next approval** to demonstrate partial success and retry without duplicating successful contacts.

## Scope

All messages and contacts are sample data. This is a browser demo, not an installed Outlook add-in or live Dynamics integration. It does not read mail, send real reminders, or create real CRM records. Changes are held in memory and reset on reload or **Reset this demo**. A read-only WebMCP review tool is registered only in browsers that support `document.modelContext`.

Built with React, TypeScript, Vite, and Tailwind CSS. `src/lib/review.ts` contains the simulated review, deduplication, and reminder logic.
