## Plan: Lit YouTube Search & Bookmarks App

**TL;DR:** Build a multi-view YouTube search application on top of your existing Lit 3 + TypeScript starter. The app has two decoupled views — **Search** and **Bookmarks** — composed from shared `<video-list>` and `<video-card>` base components. State flows through **Lit Context** providers at the app-shell level. Bookmarks persist via `localStorage`. The YouTube Data API v3 powers search. No new build tooling is needed — the existing `tsc` + `@web/dev-server` workflow carries forward.

---

### Steps

**Step 0 — Install dependencies & get a YouTube API key**

- Run `npm install @lit/context` — this is the official Lit package for the Context protocol (not included in the starter). Docs: [https://lit.dev/docs/data/context/](https://lit.dev/docs/data/context/)
- Optionally install `@lit/task` for ergonomic async data fetching (`npm install @lit/task`). Docs: [https://lit.dev/docs/data/task/](https://lit.dev/docs/data/task/)
- Get a YouTube Data API v3 key from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Enable the "YouTube Data API v3" on your project. You'll use this key as a query parameter in fetch calls.

**Step 1 — Define the file/component structure**

Create the following files under `src/`:

```
src/
  app-shell.ts              ← top-level element, context providers, navigation
  components/
    search-bar.ts           ← text input + sort dropdown
    view-toggle.ts          ← list/grid toggle button
    video-card.ts           ← single video display (shared)
    video-list.ts           ← renders array of video-cards (shared)
  views/
    search-view.ts          ← search page, composes search-bar + video-list
    bookmarks-view.ts       ← bookmarks page, composes video-list
  contexts/
    search-context.ts       ← createContext + types for search state
    bookmark-context.ts     ← createContext + types for bookmark state
  services/
    youtube-service.ts      ← fetch wrapper for YouTube Data API
    bookmark-service.ts     ← localStorage read/write for bookmarks
  types/
    video.ts                ← shared Video interface
```

This structure enforces the **decoupling requirement**: `search-view` and `bookmarks-view` are independent components that import shared base components from `components/` but have no direct dependency on each other.

**Step 2 — Define the shared `Video` type**

In `src/types/video.ts`, define an interface like:

```ts
interface Video {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  commentCount: number;
  publishedAt: string;
}
```

This is the normalized shape both views consume. The YouTube API service transforms raw API responses into this shape.

**Step 3 — Build the YouTube API service**

In `src/services/youtube-service.ts`, create a plain class/module (not a Lit component) that wraps `fetch` calls to two YouTube API endpoints:

1. **Search**: `GET https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q={query}&order={sort}&key={API_KEY}&maxResults=25`

   - `order` param accepts: `relevance`, `date`, `rating` (maps directly to your sort options)
   - Returns `snippet.title`, `snippet.description`, `snippet.thumbnails.medium.url`, `id.videoId`
   - Docs: [https://developers.google.com/youtube/v3/docs/search/list](https://developers.google.com/youtube/v3/docs/search/list)

2. **Videos (for comment counts)**: `GET https://www.googleapis.com/youtube/v3/videos?part=statistics&id={videoId1,videoId2,...}&key={API_KEY}`
   - Batch up to 50 video IDs in a single call
   - Returns `statistics.commentCount`
   - Docs: [https://developers.google.com/youtube/v3/docs/videos/list](https://developers.google.com/youtube/v3/docs/videos/list)

The service should: call search → extract video IDs → call videos endpoint → merge results into `Video[]`. Store the API key in a config constant (or an environment variable injected via `@rollup/plugin-replace`).

**Step 4 — Build the bookmark service**

In `src/services/bookmark-service.ts`, create a plain class that:

- Reads bookmarks from `localStorage` (key: `"bookmarks"`, value: `JSON.stringify(Video[])`)
- Adds a video (deduplicate by `videoId`)
- Removes a video by `videoId`
- Returns the current list

This is a pure data layer — no Lit dependency. Persistence across sessions is handled by `localStorage`. Docs: [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

**Step 5 — Set up Lit Context for state management**

Create two contexts:

1. **`src/contexts/search-context.ts`** — define a context using `createContext<SearchState>('search-state')` where `SearchState` holds `{ results: Video[], query: string, sort: string, loading: boolean }`.
2. **`src/contexts/bookmark-context.ts`** — define a context using `createContext<BookmarkState>('bookmark-state')` where `BookmarkState` holds `{ bookmarks: Video[] }` plus methods `addBookmark(video)`, `removeBookmark(videoId)`, `isBookmarked(videoId)`.

**Key Lit Context concepts to learn:**

- `createContext()` — creates a context key. Docs: [https://lit.dev/docs/data/context/#defining-a-context](https://lit.dev/docs/data/context/#defining-a-context)
- `@provide({context: ...})` decorator on a property in a **parent** element makes it available to descendants. Docs: [https://lit.dev/docs/data/context/#providing-a-context](https://lit.dev/docs/data/context/#providing-a-context)
- `@consume({context: ...})` decorator on a property in a **child** element reads the nearest ancestor's provided value. Docs: [https://lit.dev/docs/data/context/#consuming-a-context](https://lit.dev/docs/data/context/#consuming-a-context)
- Context values are **reactive** — when the provider updates the property, consumers re-render automatically (if you use `subscribe: true` on `@consume`).

**Step 6 — Build the `<app-shell>` (top-level component)**

In `src/app-shell.ts`:

- Register as `@customElement('app-shell')`
- **Provide** both contexts — this element owns the search and bookmark state and provides it down the tree via `@provide` decorators
- Render a simple nav (tabs/buttons for "Search" and "Bookmarks") and conditionally render `<search-view>` or `<bookmarks-view>` based on a `@state()` property (e.g., `activeView: 'search' | 'bookmarks'`)
- Initialize the bookmark service in `connectedCallback()` and hydrate bookmark context from `localStorage`
- Expose methods for search execution and bookmark mutations, wired into context

For the simple "routing" between views, a `@state()` property with conditional rendering in the template is sufficient — no router library needed. Docs on `@state()` (internal reactive state): [https://lit.dev/docs/components/properties/#internal-reactive-state](https://lit.dev/docs/components/properties/#internal-reactive-state)

**Step 7 — Build the shared `<video-card>` component**

In `src/components/video-card.ts`:

- `@property()` for: `video: Video`, `bookmarked: boolean`
- Render: thumbnail image, title as `<a>` linking to `https://youtube.com/watch?v=${videoId}` (opens in new tab), description (truncated in grid mode), comment count
- A "Save" / "Remove" button that dispatches a custom event: `this.dispatchEvent(new CustomEvent('toggle-bookmark', { detail: { video }, bubbles: true, composed: true }))`
- Use `composed: true` so the event crosses shadow DOM boundaries. Docs: [https://lit.dev/docs/components/events/#dispatching-events](https://lit.dev/docs/components/events/#dispatching-events)
- Style with `:host` and use CSS custom properties or `part` attributes for flexibility. Switch between list/grid layout using a CSS class or `:host([view-mode="grid"])` attribute selector.

**Step 8 — Build the shared `<video-list>` component**

In `src/components/video-list.ts`:

- `@property({type: Array})` for `videos: Video[]`
- `@property({type: Array})` for `bookmarkedIds: string[]` (to pass bookmark state to cards)
- Render using `repeat()` directive for efficient list rendering: `${repeat(this.videos, v => v.videoId, v => html`<video-card ...></video-card>`)}`
- Docs on `repeat`: [https://lit.dev/docs/templates/directives/#repeat](https://lit.dev/docs/templates/directives/#repeat)

**Step 9 — Build `<search-bar>` component**

In `src/components/search-bar.ts`:

- Text `<input>` bound to a local `@state()` property
- `<select>` dropdown for sort order (Relevance, Date, Rating)
- On form submit / Enter key, dispatch a custom event like `new CustomEvent('search-submit', { detail: { query, sort }, bubbles: true, composed: true })`
- Docs on handling input: [https://lit.dev/docs/components/events/#listening-to-events](https://lit.dev/docs/components/events/#listening-to-events)

**Step 10 — Build `<view-toggle>` component**

In `src/components/view-toggle.ts`:

- Two buttons (list icon / grid icon) that dispatch `new CustomEvent('view-mode-changed', { detail: { mode } })`
- Highlight the active mode with CSS

**Step 11 — Build `<search-view>`**

In `src/views/search-view.ts`:

- `@consume({context: searchContext, subscribe: true})` to get search results, loading state, and view mode
- `@consume({context: bookmarkContext, subscribe: true})` to know which videos are bookmarked (for the save/remove toggle on cards)
- Compose: `<search-bar>`, `<view-toggle>`, `<video-list>`
- Listen for `search-submit` event from `<search-bar>` → call the YouTube service (or dispatch upward to `app-shell`) → update context
- If using `@lit/task`, the Task reactive controller elegantly handles the loading/error/complete states of the API call. Docs: [https://lit.dev/docs/data/task/](https://lit.dev/docs/data/task/)

**Step 12 — Build `<bookmarks-view>`**

In `src/views/bookmarks-view.ts`:

- `@consume({context: bookmarkContext, subscribe: true})` to get saved videos
- Compose: `<view-toggle>`, `<video-list>`
- No search bar — just displays persisted bookmarks
- Listen for `toggle-bookmark` events from cards to remove bookmarks

**Step 13 — Wire up `<app-shell>` event handling**

In `app-shell`, listen for bubbled events:

- `toggle-bookmark` → call bookmark service → update `@provide`d bookmark context → localStorage persists automatically
- `search-submit` → call YouTube service → update `@provide`d search context

This is where context shines: updating the provided property in `app-shell` automatically triggers re-renders in all consuming descendants.

**Step 14 — Update entry points**

- Update `dev/index.html` to use `<app-shell>` instead of `<my-element>`
- Update the module script `src` to point to the compiled `app-shell.js`
- Update `index.html` if you want a production landing page

**Step 15 — Write tests**

Follow the patterns in `src/test/my-element_test.ts`:

- Create test files per component in `src/test/` (e.g., `video-card_test.ts`, `search-view_test.ts`)
- Use `fixture(html`<video-card .video=${mockVideo}></video-card>`)` to render with property bindings
- Test bookmark service independently (plain unit tests, no Lit fixtures needed)
- Mock the YouTube API service in search-view tests (e.g., provide a mock context or stub `fetch` with a test response)
- Key assertion patterns: `assert.shadowDom.equal()`, `el.shadowRoot!.querySelector()`, `el.updateComplete`

**Step 16 — Clean up**

- Remove `src/my-element.ts` and its test once you've migrated everything
- Update `package.json` `name` and metadata as appropriate

---

### Verification

1. `npm run build` — TypeScript compiles without errors
2. `npm run serve` — open browser, perform a search, see results in list and grid, toggle sort, save bookmarks, switch to bookmarks view, refresh page and confirm bookmarks persist
3. `npm run test` — all unit tests pass
4. `npm run lint` — no lint errors

### Key Lit Docs to Study (in learning order)

| Topic                                     | URL                                                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Components overview                       | [https://lit.dev/docs/components/overview/](https://lit.dev/docs/components/overview/)                 |
| Reactive properties                       | [https://lit.dev/docs/components/properties/](https://lit.dev/docs/components/properties/)             |
| Templates & expressions                   | [https://lit.dev/docs/templates/overview/](https://lit.dev/docs/templates/overview/)                   |
| Styles & Shadow DOM                       | [https://lit.dev/docs/components/styles/](https://lit.dev/docs/components/styles/)                     |
| Events                                    | [https://lit.dev/docs/components/events/](https://lit.dev/docs/components/events/)                     |
| Lifecycle                                 | [https://lit.dev/docs/components/lifecycle/](https://lit.dev/docs/components/lifecycle/)               |
| Lit Context                               | [https://lit.dev/docs/data/context/](https://lit.dev/docs/data/context/)                               |
| Task (async data)                         | [https://lit.dev/docs/data/task/](https://lit.dev/docs/data/task/)                                     |
| Directives (`repeat`, `classMap`, `when`) | [https://lit.dev/docs/templates/directives/](https://lit.dev/docs/templates/directives/)               |
| Testing                                   | [https://open-wc.org/docs/testing/testing-package/](https://open-wc.org/docs/testing/testing-package/) |

### Decisions

- **Routing**: Simple `@state()` toggle in `app-shell` rather than a router library — keeps things lightweight for two views
- **Context vs. events-only**: Lit Context is used per the requirement. Events bubble actions **up** to the provider; context flows state **down** to consumers. This is the idiomatic Lit pattern.
- **Two API calls for search**: YouTube's search endpoint doesn't return `commentCount` — a second call to the videos endpoint is needed. This is standard practice with the YouTube API.
- **`@lit/task`**: Recommended but optional. It cleanly handles loading/error/data states in templates. Without it, you'd manage those states manually with `@state()` properties.
- **No framework router**: For two views a conditional render is cleaner. If you later need URL-based routing, consider `@vaadin/router` or `@lit-labs/router`.
