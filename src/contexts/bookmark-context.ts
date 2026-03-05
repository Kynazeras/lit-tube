import {createContext} from '@lit/context';
import {Video} from '../types/video';

export interface BookmarkState {
    bookmarks: Video[];
}

export const defaultBookmarkState: BookmarkState = {
    bookmarks: [],
};

export const bookmarkContext = createContext<BookmarkState>({});
