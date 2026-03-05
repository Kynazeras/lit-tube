import {createContext} from '@lit/context';
import {Video} from '../types/video';

export interface SearchState {
    results: Video[];
    query: string;
    sort: string;
    loading: boolean;
}

export const defaultSearchState: SearchState = {
    results: [],
    query: '',
    sort: '',
    loading: false,
};

export const searchContext = createContext<SearchState>({});
