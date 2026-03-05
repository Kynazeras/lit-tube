import {LitElement, html, css} from 'lit';
import {customElement, state} from 'lit/decorators.js';

@customElement('search-bar')
export class SearchBar extends LitElement {
    @state()
    private _query = '';

    @state()
    private _sort = 'relevance';

    static override styles = css`
        :host {
            display: block;
            margin: 16px auto;
            max-width: 400px;
        }
        form {
            display: flex;
            gap: 8px;
            align-items: flex-end;
        }
        .field {
            display: flex;
            flex-direction: column;
            flex: 1;
            gap: 4px;
        }
        label {
            font-size: 0.85rem;
            font-weight: 600;
        }
        input,
        select {
            padding: 8px;
            font-size: 1rem;
        }
        button {
            padding: 8px 16px;
            font-size: 1rem;
        }
        @media (max-width: 600px) {
            form {
                flex-direction: column;
                align-items: stretch;
            }
        }
        .visually-hidden {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
    `;

    private _onSubmit(e: Event) {
        e.preventDefault();
        this.dispatchEvent(
            new CustomEvent('execute-search', {
                detail: {query: this._query, sort: this._sort},
                bubbles: true,
                composed: true,
            })
        );
    }

    override render() {
        return html`
            <form
                role="search"
                aria-label="Search YouTube videos"
                @submit="${this._onSubmit}"
            >
                <div class="field">
                    <label for="search-input">Search</label>
                    <input
                        id="search-input"
                        type="text"
                        placeholder="Search YouTube..."
                        .value="${this._query}"
                        @input="${(e: Event) =>
                            (this._query = (
                                e.target as HTMLInputElement
                            ).value)}"
                        aria-label="Search YouTube videos"
                    />
                </div>
                <div class="field">
                    <label for="sort-select">Sort</label>
                    <select
                        id="sort-select"
                        .value="${this._sort}"
                        @change="${(e: Event) =>
                            (this._sort = (
                                e.target as HTMLSelectElement
                            ).value)}"
                        aria-label="Sort results by"
                    >
                        <option value="relevance">Relevance</option>
                        <option value="date">Upload Date</option>
                        <option value="viewCount">View Count</option>
                        <option value="rating">Rating</option>
                    </select>
                </div>
                <button type="submit">Search</button>
            </form>
        `;
    }
}
