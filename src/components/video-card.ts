import {LitElement, html, css} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Video} from '../types/video';
import {sanitizeUrl, sanitizeVideoId} from '../utils/sanitize';

@customElement('video-card')
export class VideoCard extends LitElement {
    @property({type: Object})
    video: Video = {
        videoId: '',
        title: '',
        description: '',
        thumbnailUrl: '',
        commentCount: 0,
        publishedAt: '',
    };

    @property({type: Boolean})
    bookmarked = false;

    static override styles = css`
        :host {
            display: block;
            border: 1px solid #ccc;
            border-radius: 8px;
            overflow: hidden;
            max-width: 400px;
            margin: 16px auto;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            content-visibility: auto;
            contain-intrinsic-size: 0 360px;
        }
        .thumbnail {
            width: 100%;
            height: auto;
            aspect-ratio: 320 / 180;
            background-color: #e0e0e0;
        }
        .content {
            padding: 16px;
        }
        .meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 12px;
        }
    `;

    toggleBookmark() {
        this.bookmarked = !this.bookmarked;
        this.dispatchEvent(
            new CustomEvent('toggle-bookmark', {
                detail: {video: this.video},
                bubbles: true,
                composed: true,
            })
        );
    }

    override render() {
        const safeThumbnail = sanitizeUrl(this.video.thumbnailUrl);
        const safeVideoId = sanitizeVideoId(this.video.videoId);
        const bookmarkLabel = this.bookmarked
            ? `Remove bookmark for ${this.video.title}`
            : `Bookmark ${this.video.title}`;
        return html`
            <article aria-label="${this.video.title}">
                <img
                    class="thumbnail"
                    src="${safeThumbnail}"
                    alt="Thumbnail for ${this.video.title}"
                    loading="lazy"
                    decoding="async"
                    width="320"
                    height="180"
                />
                <div class="content">
                    <h3>
                        <a
                            href="https://youtube.com/watch?v=${safeVideoId}"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Watch ${this.video
                                .title} on YouTube (opens in new tab)"
                            >${this.video.title}</a
                        >
                    </h3>
                    <p class="description">${this.video.description}</p>
                    <div class="meta">
                        <p class="comments">
                            ${this.video.commentCount} comments
                        </p>
                        <p class="published">
                            Published on
                            ${new Date(
                                this.video.publishedAt
                            ).toLocaleDateString()}
                        </p>
                        <button
                            class="bookmark-btn"
                            @click="${this.toggleBookmark}"
                            aria-pressed="${this.bookmarked}"
                            aria-label="${bookmarkLabel}"
                        >
                            ${this.bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                        </button>
                    </div>
                </div>
            </article>
        `;
    }
}
