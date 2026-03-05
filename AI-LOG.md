# AI Log - Youtube Search / Bookmark Lit Project

Since I am extremely new to web components, I used Github Copilot to get a good idea of what was needed for this project.

I began with this prompt

```
I have been tasked with building a simple search/display application using the Lit webcomponents library.
I have never used Lit or webcomponents before so this is very new to me but I want to really learn it. I will give you a breakdown of what I need to build, and you will give me a detailed plan of what steps need to be taken and give guidance on where to look in the Lit docs or elsewhere to solve specific problems.
```

Then after it read through docs I gave a Markdown brief of the requirements for this project.
From there it provided me with an example file structure

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

I ran with that since it seemed straight forward
Then it provided me with an outline of the steps I needed to take and links to the Lit docs for concepts I needed to learn.

From there, I used it to explain parts of Lit to me and started telling it that I come from a React background so making comparisons would help. A good example is this piece from `app-shell.ts`.

```
<main
    @execute-search=${this._onSearchSubmit}
    @toggle-bookmark=${this._onToggleBookmark}
>
...
</main>
```

This looked really bizarre to me at first so I got a chance to learn about how events propagate in Lit.

Throughout the project, I used copilot to help me understand Lit from my React background and it helped a lot. It also helped me clean up my compliance features, create sanitation utils for security, and create a more responsive design.
