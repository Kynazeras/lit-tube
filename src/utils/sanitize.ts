export function sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') return '';
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
            return url;
        }
        return '';
    } catch {
        return '';
    }
}

export function sanitizeVideoId(id: string): string {
    if (!id || typeof id !== 'string') return '';
    return /^[a-zA-Z0-9_-]{1,20}$/.test(id) ? id : '';
}

export function stripHtmlTags(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '');
}
