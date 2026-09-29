# Dynamics design references

Checked 2026-09-29. Use these as starting points and re-open the relevant source when making a current capability claim. They describe platform possibilities, not the configuration of a particular tenant.

## Native page composition

[Model-driven app overview](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/model-driven-app-overview)

Model-driven apps compose forms, views, charts, and dashboards around Dataverse tables and relationships. The platform determines much of the interface. Use these building blocks for native designs; a freely arranged HTML page does not establish native configurability.

## Shell generation and branding

[Modern, refreshed look](https://learn.microsoft.com/en-us/power-apps/user/modern-fluent-design)

As documented at the check date, the New Look is mandatory from the 2026 Wave 1 release, while the header/navigation refresh is a separate opt-in. The earlier New Look has a floating command bar; the refreshed shell uses a full-width command bar and condensed sticky record header. Do not mix their details accidentally.

The page describes restricted modern theming and does not currently support dark mode. Avoid promising arbitrary restyling from a Fluent theme. Check current guidance before proposing brand changes. The page also retains contradictory older instructions about reverting the New Look; do not use those as reliable setup instructions.

## Fluent design assets

[Fluent 2 design resources](https://fluent2.microsoft.design/get-started/design)

Microsoft provides Figma kits and design variables that map to Fluent code libraries. They can inform control styling and design handoff. They do not provide a complete Dynamics shell or guarantee that a component, theme, or layout is supported by the target model-driven app.

## Custom page route

[Design a custom page](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/design-page-for-model-app)

Use this reference when the scenario may need a bespoke canvas-based page within a model-driven app. Verify the supported controls, responsive layout guidance, navigation, and current limitations before recommending that route. Distinguish a custom page from a standard record form and from a PCF control.
