# Present or test the demo

1. [Open Dynamine](https://kind-ground-0ee249903.5.azurestaticapps.net/).
2. Use **Continue with work account** if you are not signed in automatically.
3. Open **Pending review**, then **Review**.
4. Check the email and names. Add or correct property and relationship descriptions if known.
5. Choose **Approve & add**.
6. Open **Added contacts** and check the saved details and total. Refresh to confirm they remain.

Email is required; other details can remain blank. You can choose **Save for later** without approving. Everyone in the demo shares the same queue.

The prepared demo includes sample contacts awaiting review. Email content is simulated.

## Add a new suggestion

The flow owner runs **Dynamine - Scan sample emails**, then you choose **Refresh records**. The flow processes the 10 entries in [test-emails.json](test-emails.json). Existing contacts are skipped; missing contacts become review suggestions. Re-running the batch should not create duplicates. No email is sent.

## Explain this during the presentation

“The email is a sample. The Dynamics check is live. We review missing contacts and save approved demo records. We are not changing Dynamics.”

## If something fails

Refresh before retrying. A saved contact may only need its pending copy cleaned up; use **Retry approval**. Do not manually delete records to force the demo through. If records cannot load, ask the app owner to check the contact-data flow connection.

See [test status](flow-build-status.md). Engineering setup is kept in the [technical reference](technical-reference.md).
