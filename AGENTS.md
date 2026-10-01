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
