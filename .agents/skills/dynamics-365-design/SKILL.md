---
name: dynamics-365-design
description: "Design Microsoft Dynamics 365 Sales and Customer Service screens, user flows, and clickable prototypes using model-driven Power Apps patterns and appropriate Fluent styling. Use for Dynamics CRM interface design and design reviews; not Business Central, Finance/Supply Chain, generic Microsoft-style websites, or tenant administration."
---

# Dynamics 365 Design

Create credible, usable Sales and Customer Service designs that a Dynamics implementation team can assess. Default to screen designs and clickable prototypes. A browser prototype demonstrates the experience; it is not a deployable Dynamics solution.

## Establish the target

Use the conversation and supplied project material to identify the app, user role, primary task, main records, and desired artifact. Ask only for missing information that would materially change the design. Distinguish Sales Hub, Customer Service Hub, and a multisession service workspace: their navigation and working context can differ.

Match supplied screenshots or accessible references to the target app. Without a reference, state a provisional desktop model-driven shell and which navigation generation is assumed. Do not imply that the user's tenant has been inspected or that an optional feature is enabled. Proceed on explicit assumptions when they do not block useful design work.

Read [platform references](references/platform.md) when deciding native capability, shell details, theming, or an extension route. Verify changing product claims against the linked Microsoft documentation, especially preview features, names, and availability. User-specific evidence determines the target configuration; documentation determines supported behavior.

## Design around records and work

Start with the task and the minimum data needed to complete it. Map the journey to model-driven building blocks: navigation, table views, record forms, related data, commands, and task-focused dialogs. Much of the native layout is platform controlled, so preserve its interaction structure.

- **List/view:** use a meaningful view name, appropriate search/filter controls, clear record links, selection, sorting, and a command bar. Show bulk actions only when the scenario requires them and reflect the selection state.
- **Record form:** establish record identity, status, ownership, and important business fields; group details into useful tabs and sections. Add related-record grids and activity history where they serve the task. Put editing, saving, and validation in a coherent flow.
- **Sales:** use relevant leads, accounts, contacts, opportunities, activities, owners, and pipeline stages. Treat example stages, required fields, and qualification rules as scenario assumptions unless supplied or verified.
- **Service:** design around cases, customer context, queues/assignment, activities, knowledge, and resolution when relevant. Include multisession navigation, SLA timers, routing, or Copilot only when requested or supported by the target app evidence. Prototype automation visibly as a simulation when it could be mistaken for a live service.

Use fictional but consistent data. Preserve record identity and changes across the prototype journey. Avoid decorative dashboards that do not help the user decide or act.

## Keep visual design grounded

Use the target Dynamics shell and information density first, with Fluent components and tokens for controls and details. Fluent 2 is a supporting design language, not proof that a component or theme is configurable in Dynamics.

Prefer readable enterprise typography, restrained neutral surfaces, clear selection/focus states, and accessible status indicators. Use appropriate Fluent icons or accessible equivalents. Any hand-authored spacing, color, or size values are prototype approximations unless verified from the reference; do not label them official Dynamics tokens.

Preserve keyboard access, visible focus, field labels, meaningful control names, and error messages associated with their fields. Do not rely on color alone. Preserve useful grid density on desktop and make narrow layouts navigable without clipping primary actions.

## Make a working prototype

Use the existing project stack when there is one. For a small standalone flow without a stack, a self-contained HTML/CSS/JavaScript prototype is a useful default. If the user requests another format or framework, preserve that choice. Use actual Fluent components where the chosen stack supports them; otherwise provide an honest visual approximation.

Make the primary journey work from entry point to completion. Implement relevant search/filtering, record navigation, tabs, editable fields, validation, save/cancel, dialogs, and status changes. Do not add nonfunctional controls merely to fill the shell. Show secondary controls as unavailable when outside scope, with an explanation where needed.

Represent the states needed to evaluate the task, such as no results, validation failure, unsaved edits, successful save, and a read-only record. Add loading or failure simulations only when they matter to the scenario. Keep mock data local unless a live integration is explicitly part of the request; creating a prototype does not require a Dynamics account connection.

Inspect the rendered artifact using available browser/preview tools. Walk the primary journey, verify that changed data appears consistently, check keyboard focus and dialogs, and inspect the intended desktop and narrow layouts. Report any verification that could not be performed. Open or link the finished artifact using the available app tools.

## Explain implementation implications

For meaningful custom behavior, provide a short handoff mapping the design to its likely delivery route:

- Existing capability or standard form/view/navigation configuration.
- A custom page or custom command where supported and verified.
- A Power Apps component framework (PCF) component or other development work.
- A prototype-only simulation or a capability that still needs confirmation.

These are implementation assessments, not deployment guarantees. Verify uncertain choices rather than presenting every interaction as built in. Flag custom fields/tables, permissions, automation, and dependencies only when the design needs them. Do not invent the tenant's Dataverse schema, licensing, or role setup.

Keep implementation notes beside the artifact or in the handoff rather than inside the product's user workflow. Finish with the artifact, a brief description of the supported journey, key assumptions, and any material limitations.
