import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {repeat} from 'lit/directives/repeat.js';
import {Video} from '../types/video';
import '../components/video-card.js';

@customElement('video-list')
export class VideoList extends LitElement {
    @property({type: Array})
    videos: Video[] = [];

    @property({type: Array})
    bookmarkedIds: string[] = [];

    @property({type: String, attribute: 'list-label'})
    listLabel = 'Videos';

    static override styles = css`
        :host {
            display: block;
        }
        [role='list'] {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: space-around;
        }
    `;

    override render() {
        if (this.videos.length === 0) {
            return html`<p role="status">No videos to display.</p>`;
        }
        return html`
            <div role="list" aria-label="${this.listLabel}">
                ${repeat(
                    this.videos,
                    (video) => video.videoId,
                    (video) => html`
                        <div role="listitem">
                            <video-card
                                .video="${video}"
                                .bookmarked="${this.bookmarkedIds.includes(
                                    video.videoId
                                )}"
                            ></video-card>
                        </div>
                    `
                )}
            </div>
        `;
    }
}
