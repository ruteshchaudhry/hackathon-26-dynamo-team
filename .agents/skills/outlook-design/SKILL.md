---
name: outlook-design
description: "Design Microsoft Outlook interface components, add-in task panes, email/calendar user flows, and clickable prototypes using Outlook interaction patterns and Fluent styling. Use for Outlook UI design and design reviews; not writing emails, HTML email templates, mailbox administration, or Dynamics 365 CRM screens."
---

# Outlook Design

Create Outlook screen designs and clickable prototypes that fit the user's workflow and the available space. Keep this skill independent of Dynamics 365: Outlook work does not require a CRM connection or a Dynamics layout.

## Establish the surface

Use the conversation and supplied references to identify the user's task and the relevant context:

- Outlook client: web, new or classic Windows, Mac, or mobile.
- Item and mode: reading an email, composing a message, viewing an appointment, or organizing a meeting.
- Design surface: an add-in task pane, supported command/dialog, reusable component within that surface, or a conceptual Outlook screen.

Ask only when missing information would materially change the design. For an unspecified desktop add-in prototype, a web Outlook reading context with a right-hand pane is a reasonable explicit assumption. Do not assume all clients expose the same commands or support the same capabilities. When the user wants a native Outlook screen concept, distinguish the simulated host interface from the part an add-in can actually implement.

Read [platform references](references/platform.md) when choosing a surface, deciding host behavior, or assessing feasibility. Check current Microsoft documentation before asserting support for a client, API, manifest, preview feature, or deployment option. A reference screenshot informs the target appearance; it does not establish extensibility.

## Design for Outlook work

Keep the selected email or calendar item central to the experience. Show only the host context needed to understand the component, and visually separate the add-in content from Outlook-owned UI. Preserve item identity when moving between views.

Use focused flows with a clear primary action, concise labels, and a visible outcome. Reading and composing are different contexts: do not imply that the same action can modify content in both modes. For calendar designs, account for organizer/attendee context when it affects available actions.

Use a compact, responsive layout for task panes. Favor a single readable column, progressive disclosure, and short forms over squeezing a full application dashboard into a sidebar. Keep primary actions reachable when content grows. Avoid nested scroll areas when one will work.

For a pane intended to stay open across item changes, define how it refreshes to the newly selected item and handles unsaved local edits. Verify pinning and item-change support for the requested client and mode. Do not show stale information from the previous message. Include no-selection or unsupported-item states only if the scenario can reach them.

## Apply Fluent styling appropriately

Use the target Outlook reference for shell details, with Fluent components and tokens for the designed surface. Use official Fluent components where the project stack supports them; otherwise describe a hand-built prototype as an approximation. Do not substitute Dynamics forms, grids, or navigation for Outlook patterns.

Use restrained branding, clear text hierarchy, familiar icons, and accessible selection and focus states. Microsoft documents 20 px default container margins and spacing in 4 px increments; treat these as layout guidance and adapt deliberately to the target surface. Avoid presenting estimated dimensions or colors as official Outlook tokens.

Provide field labels, keyboard navigation, visible focus, meaningful accessible names, and errors attached to the relevant inputs. Do not rely on color alone. Match the requested theme; verify host/theme behavior before promising an automatically integrated theme. Check contrast in every theme actually delivered.

## Build and inspect the prototype

Use the existing project stack, or a self-contained HTML/CSS/JavaScript artifact for a small standalone flow. Preserve the user's requested output format. Use fictional messages, contacts, and calendar items; mock data is sufficient for design work.

Make the primary journey work end to end: enter the component, inspect relevant context, take the intended action, and see the resulting state. Implement useful navigation, input, validation, cancel/back, and completion behavior. Keep changes consistent throughout the prototype and avoid decorative controls that appear functional but do nothing.

Include the states needed to evaluate the task, such as initial, empty, editing, validation error, and completion. Add loading, failed service, sign-in, or permission states when an actual dependency makes them relevant. Distinguish simulated sending, saving, or external updates from live results. A design prototype does not require connecting a real mailbox.

Use available browser/preview tools to inspect the rendered result. Walk the primary journey, check keyboard focus and dialogs, and test narrow pane widths as well as the intended overall viewport. For persistent panes, exercise switching between two mock items. Report any checks that could not be performed. Open or link the finished artifact with the available app tools.

## Handoff

Briefly identify the target client, mode, supported journey, assumptions, and limitations. For custom behavior, distinguish the simulated Outlook shell, the proposed add-in surface, behavior needing Office.js or an external service, and capability still requiring verification.

A browser prototype is not an installed Outlook add-in. If implementation is requested later, verify the needed APIs, requirement sets, permissions, host support, and manifest route before converting it. Keep this technical mapping in handoff notes rather than inside the product's user flow.
