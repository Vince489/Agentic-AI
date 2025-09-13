//  HTML parsing using Cheerio, with focus on robustness
import cheerio from 'cheerio';
import { cleanWhitespace } from './utils.js';
import { maxContentLength } from './config.js';

export const extractMainContent = (html) => {
    try {
        if (!html) return '';
        const $ = cheerio.load(html);

        const contentSelectors = [
            'main article', 'article', 'main', 'div[role="main"]',
            'div.main', 'div.content', 'div.post', 'div.entry',
            '#main', '#content', 'body'
        ];

        let $main = null;
        for (const sel of contentSelectors) {
            $main = $(sel).first();
            if ($main.length) break;
        }
        if (!$main || !$main.length) $main = $('body');

        // Remove noise elements
        $main.find('script, style, nav, header, footer, aside, form').remove();

        // Find the content with highest text density
        let bestContent = '';
        let maxDensity = 0;
        let processedElements = 0;
        const MAX_ELEMENTS = 100; // Safety limit

        $main.children().each((_, el) => {
            // Safety check to prevent infinite loops
            if (processedElements++ > MAX_ELEMENTS) return false;

            const $el = $(el);
            const text = cleanWhitespace($el.text());
            const tagCount = $el.find('*').length;
            const density = text.length / (tagCount + 1);

            if (text.length > 100 && density > maxDensity) {
                maxDensity = density;
                bestContent = text;
            }
        });

        if (!bestContent) bestContent = cleanWhitespace($main.text());
        return bestContent.substring(0, maxContentLength) + (bestContent.length > maxContentLength ? '...' : '');

    } catch (error) {
        console.error('Content extraction error:', error);
        return ''; // or a simpler fallback
    }
};

export const extractSearchResults = (html, source) => {
    try {
        if (!html) return [];
        const $ = cheerio.load(html);
        const results = [];

        // SearXNG specific selectors
        if (source === 'SearXNG') {
            // First check for answers
            if ($('#answers').length) {
                $('.answer').each((_, answerEl) => {
                    const $answer = $(answerEl);
                    const snippet = cleanWhitespace($answer.find('span').text());
                    const $link = $answer.find('.answer-url');
                    const url = $link.attr('href');
                    const title = cleanWhitespace($link.text());

                    if (url && url.startsWith('http')) {
                        results.push({ url, title, snippet, source });
                    }
                });
            }

            // Then check for regular results
            $('.result-instance').each((_, resEl) => {
                const $res = $(resEl);
                const $titleLink = $res.find('h3 a'); // Target the <a> tag inside h3 for URL and Title
                const $snippet = $res.find('p'); // Target the <p> for the snippet

                const url = $titleLink.attr('href');
                const title = cleanWhitespace($titleLink.text());
                const snippet = cleanWhitespace($snippet.text());

                if (url && url.startsWith('http')) {
                    results.push({ url, title, snippet, source });
                }
            });

            return results;
        }

        // Generic selectors for other search engines
        const resultSelectors = [
            'article.result', '.result-item', '.result', '.search-result'
        ];
        const linkSelectors = [
            'h3 a', 'h4 a', '.result-title a', '.title a', 'a.result-link'
        ];
        const snippetSelectors = [
            'p.content', 'p.result-content', '.snippet', '.description', '.result-snippet', '.content'
        ];

        for (const resSel of resultSelectors) {
            $(resSel).each((_, resEl) => {
                const $res = $(resEl);
                let url, title, snippet;

                for (const linkSel of linkSelectors) {
                    const $link = $res.find(linkSel).first();
                    if ($link.length) {
                        url = $link.attr('href');
                        title = cleanWhitespace($link.text());
                        break;
                    }
                }
                if (!url) return;

                for (const snipSel of snippetSelectors) {
                    const $snip = $res.find(snipSel).first();
                    if ($snip.length) {
                        snippet = cleanWhitespace($snip.text());
                        break;
                    }
                }

                if (url.startsWith('http')) {
                    results.push({ url, title, snippet, source });
                }
            });
            if (results.length) break;
        }

        return results;

    } catch (error) {
        console.error('Search result extraction error:', error);
        return [];
    }
};
