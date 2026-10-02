# Publish the MYNUS 360 Kiosk

## Goal
Host the kiosk at a public URL and share the link with the owner.

## Steps
1. Run a security scan on the project and review the results.
   - If any critical findings appear, report them and pause for the owner's decision before publishing.
2. Publish the app using the Publish action (frontend goes live at the project's lovable.app URL).
3. Verify the published URL responds.
4. Share the live URL with the owner, along with the option to rename the lovable.app link or connect a custom domain later in Project Settings > Domains.

## Notes
- No code changes are needed — the kiosk is already built.
- Backend features (owner notifications) still report "not configured" until the owner's WhatsApp/email details are complete; this does not block publishing.
