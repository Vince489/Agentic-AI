//  Configuration for search engines, timeouts, etc.
export const searchEngines = [
    {
        name: 'SearXNG',
        url: 'http://localhost:8080/search?q=',
        isHtml: true,
    }
];

export const fetchTimeout = 10000; // milliseconds
export const maxContentLength = 2000;
export const maxSearchRetries = 3;
export const cacheExpiration = 30 * 60 * 1000; // milliseconds
export const myUserAgent = 'MyAwesomeSearchBot/1.0';
export const excludedDomains = [
    'facebook.com',
    'twitter.com',
    //  ...
];