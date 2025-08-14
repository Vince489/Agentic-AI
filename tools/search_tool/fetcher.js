//  Handles fetching URLs with error handling, timeouts, etc.
import { retry, cleanWhitespace } from './utils.js';
import { fetchTimeout, myUserAgent } from './config.js';

const fetchWithTimeout = async (url) => {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), fetchTimeout);
    
    try {
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/html, */*'
            },
            signal: abortController.signal,
            redirect: 'follow'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status} for ${url}`);
        }
        
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
};

export const fetchContent = async (url) => {
    try {
        const response = await retry(() => fetchWithTimeout(url), 3, 1000);
        const contentType = response.headers.get('Content-Type');

        if (!contentType) {
            console.warn(`No Content-Type for ${url}, assuming text/html`);
        }

        if (contentType && contentType.includes('text/html')) {
            return {
                url,
                text: await response.text(),
                isHtml: true,
            };
        } else if (contentType && contentType.includes('application/json')) {
            return {
                url,
                json: await response.json(),
                isHtml: false,
            };
        } else {
            console.warn(`Unsupported Content-Type: ${contentType} for ${url}, skipping`);
            return null;
        }

    } catch (error) {
        console.error(`Failed to fetch ${url}: ${error}`);
        return null;
    }
};
