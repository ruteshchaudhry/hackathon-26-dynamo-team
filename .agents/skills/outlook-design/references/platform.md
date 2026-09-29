# Outlook design references

Checked 2026-09-29. Open the relevant source again for claims that depend on current client support or APIs. Office-wide guidance does not imply that every Office surface is available in Outlook.

## Interface and visual language

[Office Add-in design principles](https://learn.microsoft.com/en-us/office/dev/add-ins/design/add-in-design) and [Office design language](https://learn.microsoft.com/en-us/office/dev/add-ins/design/add-in-design-language)

Treat the add-in as a contextual extension of the user's work. Keep branding restrained and interactions clear. Fluent UI is an appropriate design foundation, but adopting it does not make an arbitrary layout or action native to Outlook.

[Fluent 2 design resources](https://fluent2.microsoft.design/get-started/design)

Microsoft's Figma kits provide components and design variables. Use them for custom component styling and handoff; they are not a complete Outlook shell or a statement of Outlook add-in support.

## Pane layout

[Task panes](https://learn.microsoft.com/en-us/office/dev/add-ins/design/task-pane-add-ins) and [layout guidelines](https://learn.microsoft.com/en-us/office/dev/add-ins/design/add-in-layout)

Task panes commonly sit beside the working content. Use responsive layouts rather than treating example dimensions as fixed requirements. The layout guidance recommends 20 px default container margins and spacing in multiples of 4 px. Avoid redundant branding; the Office task-pane BrandBar recommendation specifically excludes Outlook.

## Host capabilities and context

[Outlook add-ins overview](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/outlook-add-ins-overview)

Use this starting point to check activation, read/compose contexts, extension surfaces, and client support. Do not assume an add-in can replace Outlook's overall layout or that a feature works on every desktop and mobile client.

[Pinnable task panes](https://learn.microsoft.com/en-us/office/dev/add-ins/outlook/pinnable-taskpane)

A pane that persists while the selected item changes needs to update its context. Check supported clients and modes before designing pinning as available. A mock persistent pane should demonstrate selection changes without displaying data from the previous item.
