# Company sign-in

Users sign in with their company account. All signed-in users in the configured organisation can use the shared demo queue. **They do not need SharePoint site or list permissions.**

The app reuses an existing Microsoft session where possible. Microsoft may still ask the user to choose an account, sign in, or approve verification. Signing out stops automatic sign-in in that tab.

The app's private backend uses **Dynamine - Contact data**, which runs through the flow owner's existing connection. The demo no longer depends on the outstanding Graph application-permission consent from the earlier approach.

No further Graph administrator-consent step is required for this connection. Existing company sign-in rules, flow licensing and environment policies still apply. The owner's connection must remain valid.

App registration details and setup commands are in the [technical reference](technical-reference.md). Existing unused grants were left unchanged; they are not part of the runtime path.
