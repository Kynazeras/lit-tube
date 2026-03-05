import {LitElement, html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';
import {provide} from '@lit/context';
import {searchContext, SearchState} from './contexts/search-context';
import {bookmarkContext, BookmarkState} from './contexts/bookmark-context';
import {BookmarkService} from './services/bookmark-service';
import {YoutubeService} from './services/youtube-service';
import {Video} from './types/video';
import './views/search-view.js';
import './views/bookmarks-view.js';

@customElement('app-shell')
export class AppShell extends LitElement {
    @provide({context: searchContext})
    @state()
    searchState: SearchState = {
        results: [],
        query: '',
        sort: '',
        loading: false,
    };

    @provide({context: bookmarkContext})
    @state()
    bookmarkState: BookmarkState = {
        bookmarks: [],
    };

    override connectedCallback(): void {
        super.connectedCallback();
        this.bookmarkState = {
            ...this.bookmarkState,
            bookmarks: BookmarkService.getBookmarks(),
        };
    }

    @state()
    private _activeTab: 'search' | 'bookmarks' = 'search';

    private _youtubeService = new YoutubeService();
    private _searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
    private static readonly DEBOUNCE_MS = 300;

    async executeSearch(query: string, sort: string) {
        this.searchState = {...this.searchState, query, sort, loading: true};
        try {
            const results = await this._youtubeService.search(query, sort);
            this.searchState = {...this.searchState, results, loading: false};
        } catch (error: unknown) {
            // Silently ignore aborted requests — a newer search replaced this one
            if (error instanceof DOMException && error.name === 'AbortError') {
                return;
            }
            this.searchState = {
                ...this.searchState,
                results: [],
                loading: false,
            };
        }
    }

    addBookmark(video: Video) {
        BookmarkService.addBookmark(video);
        this.bookmarkState = {bookmarks: BookmarkService.getBookmarks()};
    }

    removeBookmark(videoId: string) {
        BookmarkService.removeBookmark(videoId);
        this.bookmarkState = {bookmarks: BookmarkService.getBookmarks()};
    }

    toggleBookmark(video: Video) {
        if (BookmarkService.isBookmarked(video.videoId)) {
            this.removeBookmark(video.videoId);
        } else {
            this.addBookmark(video);
        }
    }

    static override styles = css`
        :host {
            display: block;
        }
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: #000;
            color: #fff;
            padding: 8px;
            z-index: 100;
            transition: top 0.2s;
        }
        .skip-link:focus {
            top: 0;
        }
        nav[role='tablist'] {
            display: flex;
            gap: 4px;
        }
        nav[role='tablist'] button {
            cursor: pointer;
        }
        nav[role='tablist'] button[aria-selected='true'] {
            font-weight: bold;
            text-decoration: underline;
        }
    `;

    override render() {
        return html`
            <a
                class="skip-link"
                href="#main-content"
                @click="${this._skipToMain}"
                >Skip to main content</a
            >
            <header>
                <h1>YouTube Browser</h1>
            </header>
            <nav role="tablist" aria-label="Main navigation">
                <button
                    role="tab"
                    id="tab-search"
                    aria-selected="${this._activeTab === 'search'}"
                    aria-controls="tabpanel-main"
                    tabindex="${this._activeTab === 'search' ? 0 : -1}"
                    @click=${() => this._switchTab('search')}
                    @keydown=${this._onTabKeydown}
                >
                    Search
                </button>
                <button
                    role="tab"
                    id="tab-bookmarks"
                    aria-selected="${this._activeTab === 'bookmarks'}"
                    aria-controls="tabpanel-main"
                    tabindex="${this._activeTab === 'bookmarks' ? 0 : -1}"
                    @click=${() => this._switchTab('bookmarks')}
                    @keydown=${this._onTabKeydown}
                >
                    Bookmarks
                </button>
            </nav>
            <main
                id="main-content"
                role="tabpanel"
                aria-labelledby="tab-${this._activeTab}"
                tabindex="-1"
                @execute-search=${this._onSearchSubmit}
                @toggle-bookmark=${this._onToggleBookmark}
            >
                ${this._activeTab === 'search'
                    ? html`<search-view></search-view>`
                    : html`<bookmarks-view></bookmarks-view>`}
            </main>
        `;
    }

    private _skipToMain(e: Event) {
        e.preventDefault();
        const main = this.shadowRoot?.getElementById('main-content');
        main?.focus();
    }

    private _switchTab(tab: 'search' | 'bookmarks') {
        this._activeTab = tab;
        // Move focus to the newly active tab panel after render
        this.updateComplete.then(() => {
            const main = this.shadowRoot?.getElementById('main-content');
            main?.focus();
        });
    }

    private _onTabKeydown(e: KeyboardEvent) {
        const tabs: ('search' | 'bookmarks')[] = ['search', 'bookmarks'];
        const currentIndex = tabs.indexOf(this._activeTab);
        let newIndex = currentIndex;

        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            newIndex = (currentIndex + 1) % tabs.length;
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        } else if (e.key === 'Home') {
            e.preventDefault();
            newIndex = 0;
        } else if (e.key === 'End') {
            e.preventDefault();
            newIndex = tabs.length - 1;
        } else {
            return;
        }

        this._activeTab = newIndex === 0 ? 'search' : 'bookmarks';
        this.updateComplete.then(() => {
            const tabId = `tab-${tabs[newIndex]}`;
            const tabEl = this.shadowRoot?.getElementById(tabId);
            (tabEl as HTMLElement)?.focus();
        });
    }

    private _onSearchSubmit(e: CustomEvent<{query: string; sort: string}>) {
        // Debounce rapid submissions to avoid concurrent YouTube API requests
        if (this._searchDebounceTimer) {
            clearTimeout(this._searchDebounceTimer);
        }
        this._searchDebounceTimer = setTimeout(() => {
            this.executeSearch(e.detail.query, e.detail.sort);
        }, AppShell.DEBOUNCE_MS);
    }

    private _onToggleBookmark(e: CustomEvent<{video: Video}>) {
        this.toggleBookmark(e.detail.video);
    }
}
