# Contact Capture

A standalone version of the Lovable Contact Capture prototype. The original design, sample inbox, review workflow, and simulated Dynamics contacts are preserved.

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

1. Open **Outlook inbox**, search the 30 sample messages, and open an email.
2. Open **Contact Capture**. The initial scan finds eight potential contacts, seven existing contacts, and 15 excluded emails.
3. Review or edit the names, property, premises, and relationship. Incomplete contacts cannot be selected until completed.
4. Select contacts, choose **Add selected to Dynamics**, and confirm.
5. Open **Dynamics contacts** to find the new records, filter the list, and inspect their premises relationships and source emails.
6. Enable **Simulate one Dynamics failure** before adding a batch to demonstrate partial success and retry.
7. Use **Reset demo** to restart.

All emails and CRM records are sample data. No live Outlook or Dynamics account is connected. State is held in browser memory and resets on a full reload; navigation among the three screens retains it. The surrounding Outlook and Dynamics application controls are visual prototype elements; the implemented flow is contact capture, review, and simulated creation.

## Project structure

- `src/routes/`: the three screens.
- `src/lib/mock-data.ts`: the original sample messages, properties, premises, and contacts.
- `src/lib/integrations/`: simulated Outlook and Dynamics adapters.
- `src/lib/demo-store.ts`: shared in-memory demo state.
- `src/styles.css`: original theme and responsive adjustments.

Imported from the user-provided Lovable project on 30 September 2026. This copy runs independently using React, TypeScript, Vite, and Tailwind CSS.
