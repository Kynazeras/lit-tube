import {Video} from '../types/video';

export class BookmarkService {
  private static readonly STORAGE_KEY = 'bookmarks';

  static getBookmarks(): Video[] {
    const bookmarks = localStorage.getItem(this.STORAGE_KEY);
    return bookmarks ? JSON.parse(bookmarks) : [];
  }

  static addBookmark(video: Video): void {
    const bookmarks = this.getBookmarks();
    if (bookmarks.some((bookmark) => bookmark.videoId === video.videoId)) {
      return;
    }
    bookmarks.push(video);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
  }

  static removeBookmark(videoId: string): void {
    const bookmarks = this.getBookmarks();
    const updatedBookmarks = bookmarks.filter(
      (bookmark) => bookmark.videoId !== videoId
    );
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedBookmarks));
  }

  static isBookmarked(videoId: string): boolean {
    const bookmarks = this.getBookmarks();
    return bookmarks.some((bookmark) => bookmark.videoId === videoId);
  }
}
