import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';
import {consume} from '@lit/context';
import {
    bookmarkContext,
    BookmarkState,
    defaultBookmarkState,
} from '../contexts/bookmark-context';

@customElement('bookmarks-view')
export class BookmarksView extends LitElement {
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
            <h2>Your Bookmarked Videos</h2>
            <div aria-live="polite" aria-atomic="true">
                ${this.bookmarkState.bookmarks.length === 0
                    ? html`<p role="status">You have no bookmarks yet.</p>`
                    : html`
                          <video-list
                              list-label="Bookmarked videos"
                              .videos="${this.bookmarkState.bookmarks}"
                              .bookmarkedIds="${this.bookmarkState.bookmarks.map(
                                  (b) => b.videoId
                              )}"
                          ></video-list>
                      `}
            </div>
        `;
    }
}
