# App and integration work

Owner: Rutesh.

## Deliver

A simple company sign-in, **Pending review**, editable contact details, **Approve & add**, **Added contacts**, and a saved-contact total. Keep the blue and magenta theme, generic name and no company logo. User screens should explain the task without naming the technology.

The app uses shared records. Users need app sign-in only. A private server connection handles storage using the flow owner's existing access.

## Approval rules

- Save the user's corrections before approving.
- Create and confirm the approved contact before removing its pending item.
- Reject outdated edits and prevent duplicate additions.
- Keep unsuccessful records available for retry.
- Count saved contacts, including after refresh or signing in again.
- Make no Dynamics changes.

The current app has **Refresh records**; the flow owner runs scans separately. No extra approval screen or email approval is needed.

## Check before presenting

Sign in, review a sample, change a detail, approve it, then refresh **Added contacts**. Confirm the correction and total remain. Test a second company account when available.

See [test status](setup/flow-build-status.md) and the [technical reference](setup/technical-reference.md) for implementation and deployment.
