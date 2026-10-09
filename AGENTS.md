<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Menu data lives in src/lib/menu.ts and dish photos in src/assets/menu-images.json (CDN URLs cropped from owner's menu pages) — never invent items, prices or photos.
- Owner notifications go through the notifyOwner server function and report "not_configured" until secrets exist — never claim a notification was sent without a real API success.
- Customer orders use the server-validated shared orders table with a retry key; device storage must not be the authoritative order source.
- Staff screens live beneath the client-only authenticated layout; role-scoped server reads enforce access because browser navigation is not a permission boundary.
- Order status changes use the atomic transition_order RPC and its audit events to prevent competing staff actions.
- Owner analytics derive from the complete RLS-scoped order set, while realtime invalidation and timed refresh keep staff orders current.
- ID-only worker authentication uses the shared deterministic synthetic-email mapper and a unique normalized profiles.login_id; accounts are provisioned through privileged Auth administration, never a public signup or client-side credential check.
