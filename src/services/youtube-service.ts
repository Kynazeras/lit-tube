import {YOUTUBE_API_KEY} from '../config';
import {Video} from '../types/video';
import {sanitizeUrl, sanitizeVideoId, stripHtmlTags} from '../utils/sanitize';

interface YouTubeSearchItem {
    id: {videoId: string};
    snippet: {
        title: string;
        description: string;
        thumbnails: {medium: {url: string}};
        publishedAt: string;
    };
}

interface YouTubeVideoItem {
    id: string;
    statistics: {commentCount: number};
}

const API_KEY = YOUTUBE_API_KEY;

export class YoutubeService {
    private _abortController: AbortController | null = null;

    /**
     * Abort any in-flight request so we never have stale concurrent
     * calls competing for the same UI update.
     */
    abort() {
        if (this._abortController) {
            this._abortController.abort();
            this._abortController = null;
        }
    }

    async search(query: string, sort: string): Promise<Video[]> {
        this.abort();
        this._abortController = new AbortController();
        const signal = this._abortController.signal;

        const encodedQuery = encodeURIComponent(query);
        const encodedSort = encodeURIComponent(sort);
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodedQuery}&order=${encodedSort}&key=${API_KEY}&maxResults=25`,
            {signal}
        );
        if (!response.ok) {
            throw new Error('Failed to fetch videos');
        }
        const data = await response.json();
        const videos: Video[] = data.items.map((item: YouTubeSearchItem) => ({
            videoId: sanitizeVideoId(item.id.videoId),
            title: stripHtmlTags(item.snippet.title),
            description: stripHtmlTags(item.snippet.description),
            thumbnailUrl: sanitizeUrl(item.snippet.thumbnails.medium.url),
            commentCount: 0,
            publishedAt: item.snippet.publishedAt,
        }));

        const videoIds = videos.map((v) => v.videoId);
        const commentCounts = await this.comments(videoIds, signal);
        for (const video of videos) {
            video.commentCount = commentCounts[video.videoId] ?? 0;
        }

        return videos;
    }

    async comments(
        videoIds: string[],
        signal?: AbortSignal
    ): Promise<{[videoId: string]: number}> {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(
                ','
            )}&key=${API_KEY}`,
            {signal}
        );
        if (!response.ok) {
            throw new Error('Failed to fetch video statistics');
        }
        const data = await response.json();
        const comments: {[videoId: string]: number} = {};
        data.items.forEach((item: YouTubeVideoItem) => {
            comments[item.id] = item.statistics.commentCount;
        });
        return comments;
    }
}
