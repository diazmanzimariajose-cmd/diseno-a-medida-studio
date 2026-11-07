<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Game rules (line order, starter/speaker flipping, scene cycling, progress) live in pure TS under `src/lib/game/` with vitest tests; components only render that state. Why: playback logic must stay testable without a browser.
- Conversations persist in localStorage and audio clips in IndexedDB keyed by dialogue line id (`src/lib/game/storage.ts`). Why: works offline with no login; move to Lovable Cloud only if sharing across devices is requested.
- Playback (`src/hooks/use-conversation-player.ts`) prefers a recorded clip per line and falls back to browser speechSynthesis; mouth frames are toggled via `data-mouth` on DOM nodes, not React state. Why: avoids 60fps re-renders.
- Characters are two aligned image frames (idle + talking mouth composited onto the idle frame); body gestures are CSS keyframes keyed on `data-state`. Why: lip-sync without misalignment between frames.
