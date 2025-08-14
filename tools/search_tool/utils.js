//  Utility functions (e.g., for retries, caching)
export async function retry(fn, maxRetries, delay) {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const waitTime = delay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    throw lastError;
}

export const createCache = (expirationTime) => {
    const cache = new Map();
    
    return {
        get(key) {
            const item = cache.get(key);
            if (!item) return null;
            if (Date.now() > item.expiry) {
                cache.delete(key);
                return null;
            }
            return item.value;
        },
        set(key, value) {
            const expiry = Date.now() + expirationTime;
            cache.set(key, { value, expiry });
        }
    };
};

export const cleanWhitespace = (text) => text ? text.replace(/\s+/g, ' ').trim() : '';

export const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
};