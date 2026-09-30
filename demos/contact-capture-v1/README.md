# Contact Capture

The original Outlook and Dynamics demo screens with the supplied DynaMine HTML design as the contact-sync application. All original sample messages, suggestions, properties, premises, relationships, and existing Dynamics contacts are preserved.

## Run locally

Requires Node.js 22.12+ and pnpm.

```sh
pnpm install
pnpm dev
```

Open the local address printed by the development server.

## Build

```sh
pnpm build
pnpm preview
```

The build creates a static website in `dist/`. Configure your host to serve `index.html` for the `/outlook` and `/dynamics` routes.

## Demo walkthrough

1. Open **Outlook inbox** and choose **Your contacts are ready to review and sync**. Its **Review and sync contacts** link opens the contact review page. The inbox contains this invitation plus the 30 sample messages from the scan.
2. The invitation opens DynaMine's transfer animation, then **Pending review** with eight original suggestions from 30 scanned emails. The seven existing contacts remain in Dynamics; the 15 excluded emails remain in Outlook.
3. Review or edit the names, email, property, premises, and relationship in the inline editor. **View email context** shows the original source message. As in the supplied HTML, email is required and other details are optional.
4. Choose **Add** or **Add selected**. **Ignore** removes a suggestion from the queue and **Undo** restores it. **Added contacts** shows approved records.
5. Open **Dynamics contacts** to find the new records, filter the list, and inspect their premises relationships and source emails.
6. Navigate between the three screens to verify saved edits and approvals persist. Duplicate email addresses already in Dynamics are blocked.
7. Use **Reset sample data** to clear shared approvals and restore all suggestions, or **Reset demo** to restart the complete journey.

All emails and CRM records are sample data. No live Outlook or Dynamics account is connected. State is held in browser memory and resets on a full reload; navigation among the three screens retains it. The surrounding Outlook and Dynamics application controls are visual prototype elements; the implemented flow is contact capture, review, and simulated creation.

The invitation's magic-link journey is simulated with local navigation. It does not send an email, authenticate a user, or issue a secure token. The invitation arrives after the sample scan window and is not counted in the 30 scanned messages.

## Project structure

- `src/routes/`: the three screens.
- `src/lib/mock-data.ts`: the original sample messages, properties, premises, and contacts.
- `src/lib/integrations/`: simulated Outlook and Dynamics adapters.
- `src/lib/demo-store.ts`: shared in-memory demo state.
- `src/lib/dynamine-store.ts`: maps the original fixtures and approvals to the HTML application's data model.
- `src/design/dynamine-prototype.html`: unchanged copy of the supplied design. The sync route mounts its markup and renderer in an isolated frame to preserve the original CSS; Alex Morgan replaces the template's sample reviewer, Sam.
- `src/styles.css`: original theme and responsive adjustments.

Run `pnpm test` for fixture preservation, shared approval state, duplicate prevention, ignore/undo, and reset checks.

Imported from the user-provided Lovable project on 30 September 2026. This copy runs independently using React, TypeScript, Vite, and Tailwind CSS.
