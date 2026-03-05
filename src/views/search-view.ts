import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {consume} from '@lit/context';
import {
    defaultSearchState,
    searchContext,
    SearchState,
} from '../contexts/search-context';
import {
    bookmarkContext,
    BookmarkState,
    defaultBookmarkState,
} from '../contexts/bookmark-context';
import '../components/search-bar.js';
import '../components/video-list.js';

@customElement('search-view')
export class SearchView extends LitElement {
    @consume({context: searchContext, subscribe: true})
    searchState: SearchState = defaultSearchState;

    @consume({context: bookmarkContext, subscribe: true})
    bookmarkState: BookmarkState = defaultBookmarkState;

    static override styles = css`
        :host {
            display: block;
            padding: 16px;
        }
    `;

    override render() {
        return html`
            <h2 id="search-heading">Search Videos</h2>
            <search-bar
                @execute-search="${(e: CustomEvent) =>
                    this.dispatchEvent(
                        new CustomEvent('execute-search', {
                            detail: e.detail,
                            bubbles: true,
                            composed: true,
                        })
                    )}"
            ></search-bar>
            <div aria-live="polite" aria-atomic="true" role="status">
                ${this.searchState.loading
                    ? html`<p>Loading search results...</p>`
                    : html`
                          <video-list
                              list-label="Search results"
                              .videos="${this.searchState.results}"
                              .bookmarkedIds="${this.bookmarkState.bookmarks.map(
                                  (b) => b.videoId
                              )}"
                          ></video-list>
                      `}
            </div>
        `;
    }
}
