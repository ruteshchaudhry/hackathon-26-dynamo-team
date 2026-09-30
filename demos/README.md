# Contact Capture prototypes

Two standalone browser demos for comparing contact-capture workflows. These are separate from the shared app in `frontend/` and do not use its live backend.

| Version | What it demonstrates |
|---|---|
| [V1 — Original workflow](contact-capture-v1/README.md) | Lovable prototype recreated as a standalone app: scan a sample inbox, review candidates, confirm additions, and inspect simulated Dynamics records. |
| [V2 — Embedded review](contact-capture-v2/README.md) | Weekly digest, one shared queue in Outlook and Dynamics, ready/needs-input groups, one-action approval, source evidence, and existing-contact premises links. |

## Run both locally

Requires Node.js 22.12+ and pnpm. Use a separate terminal for each demo.

```sh
cd demos/contact-capture-v1
pnpm install --frozen-lockfile
pnpm dev --port 5173
```

```sh
cd demos/contact-capture-v2
pnpm install --frozen-lockfile
pnpm dev --port 5174
```

Open `http://127.0.0.1:5173` for V1 and `http://127.0.0.1:5174` for V2. Run `pnpm build` within either folder to produce its static `dist/` output. V1 hosting needs an `index.html` fallback for `/outlook` and `/dynamics`.

All records and mail are sample data. Both demos keep changes in browser memory; a full reload resets them. No Outlook or Dynamics account is connected. V2's weekly reminders and failure/retry controls are simulations, not background jobs.

Deployment-specific Sites configuration is omitted so copying or running these folders cannot overwrite the separately hosted demos.
