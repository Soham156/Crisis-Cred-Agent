const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class RapidAPINewsService {
    constructor() {
        this.apiKey = config.rapidapi?.apiKey;
        this.realtimeApiKey = config.rapidapi?.realtimeApiKey;
        this.googleSearchUrl = 'https://google-search74.p.rapidapi.com';
        this.realtimeNewsUrl = 'https://real-time-news-data.p.rapidapi.com';
        this.bingSearchUrl = 'https://bing-search-apis.p.rapidapi.com/api/rapid/web_search';
        this.bingNewsUrl = 'https://bing-search-apis.p.rapidapi.com/api/rapid/news_search';
        this.enabled = !!this.apiKey || !!this.realtimeApiKey;

        if (!this.enabled) {
            logger.warn('RapidAPI keys not configured');
        }
    }

    /**
     * Search Google using RapidAPI (google-search74)
     */
    async searchGoogle(query, options = {}) {
        if (!this.apiKey) {
            return [];
        }

        try {
            logger.info('Searching Google via RapidAPI', { query });

            const response = await axios.get(`${this.googleSearchUrl}/`, {
                params: {
                    query: query,
                    limit: options.maxResults || 10,
                    related_keywords: 'true',
                },
                headers: {
                    'x-rapidapi-host': 'google-search74.p.rapidapi.com',
                    'x-rapidapi-key': this.apiKey
                }
            });

            const results = response.data?.results || [];
            logger.info(`RapidAPI Google Search found ${results.length} results`);

            return this.formatGoogleResults(results);
        } catch (error) {
            logger.error('RapidAPI Google Search error:', error.message);
            return [];
        }
    }

    /**
     * Search Bing Web using RapidAPI
     */
    async searchBing(query, options = {}) {
        if (!this.apiKey) {
            return [];
        }

        try {
            logger.info('Searching Bing Web via RapidAPI', { query });

            const response = await axios.get(this.bingSearchUrl, {
                params: {
                    keyword: query,
                    page: 0,
                    size: options.maxResults || 10,
                },
                headers: {
                    'x-rapidapi-host': 'bing-search-apis.p.rapidapi.com',
                    'x-rapidapi-key': this.apiKey
                }
            });

            const results = response.data?.data || [];
            logger.info(`RapidAPI Bing Web Search found ${results.length} results`);

            return this.formatBingResults(results);
        } catch (error) {
            logger.error('RapidAPI Bing Web Search error:', error.message);
            return [];
        }
    }

    /**
     * Search Bing News using RapidAPI
     */
    async searchBingNews(query, options = {}) {
        if (!this.apiKey) {
            return [];
        }

        try {
            logger.info('Searching Bing News via RapidAPI', { query });

            const response = await axios.get(this.bingNewsUrl, {
                params: {
                    keyword: query,
                    page: 0,
                    size: options.maxResults || 10,
                    cc: options.country || 'US',
                },
                headers: {
                    'x-rapidapi-host': 'bing-search-apis.p.rapidapi.com',
                    'x-rapidapi-key': this.apiKey
                }
            });

            const results = response.data?.data || [];
            logger.info(`RapidAPI Bing News Search found ${results.length} results`);

            return this.formatBingResults(results);
        } catch (error) {
            logger.error('RapidAPI Bing News Search error:', error.message);
            return [];
        }
    }

    /**
     * Search Real-Time News Data API
     */
    async searchRealtimeNews(query, options = {}) {
        if (!this.realtimeApiKey) {
            return [];
        }

        try {
            logger.info('Searching Real-Time News Data API', { query });

            const response = await axios.get(`${this.realtimeNewsUrl}/search`, {
                params: {
                    query: query,
                    limit: options.limit || 10,
                    time_published: options.timePublished || 'anytime',
                    country: options.country || 'US',
                    lang: options.lang || 'en',
                },
                headers: {
                    'x-rapidapi-host': 'real-time-news-data.p.rapidapi.com',
                    'x-rapidapi-key': this.realtimeApiKey
                }
            });

            const articles = response.data?.data || [];
            logger.info(`RapidAPI Real-Time News found ${articles.length} articles`);

            return this.formatRealtimeArticles(articles);
        } catch (error) {
            logger.error('RapidAPI Real-Time News error:', error.message);
            return [];
        }
    }

    /**
     * Search all RapidAPI sources and combine results
     */
    async searchNews(query, options = {}) {
        if (!this.enabled) {
            logger.warn('RapidAPI search skipped - API keys not configured');
            return [];
        }

        try {
            // Search APIs in parallel
            const [googleResults, bingWebResults, bingNewsResults, realtimeResults] = await Promise.allSettled([
                this.searchGoogle(query, options),
                this.searchBing(query, options),
                this.searchBingNews(query, options),
                this.searchRealtimeNews(query, options),
            ]);

            const allArticles = [
                ...(googleResults.status === 'fulfilled' ? googleResults.value : []),
                ...(bingWebResults.status === 'fulfilled' ? bingWebResults.value : []),
                ...(bingNewsResults.status === 'fulfilled' ? bingNewsResults.value : []),
                ...(realtimeResults.status === 'fulfilled' ? realtimeResults.value : []),
            ];

            logger.info(`RapidAPI combined: ${allArticles.length} total articles`);
            return allArticles;
        } catch (error) {
            logger.error('RapidAPI combined search error:', error.message);
            return [];
        }
    }

    /**
     * Search for claim-specific news
     */
    async searchForClaim(claim) {
        const query = `"${claim}" OR fact check OR verification`;
        return await this.searchNews(query, { maxResults: 5, limit: 5 });
    }

    /**
     * Format Google Search results
     */
    formatGoogleResults(results) {
        return results.map(result => ({
            title: result.title || '',
            snippet: result.description || '',
            source: result.domain || 'Google Search',
            link: result.url || '',
            date: new Date().toISOString(),
            imageUrl: null,
        }));
    }

    /**
     * Format Bing Search results
     */
    formatBingResults(results) {
        return results.map(result => ({
            title: result.title || '',
            snippet: result.description || '',
            source: result.domain || 'Bing Search',
            link: result.url || '',
            date: result.date || new Date().toISOString(),
            imageUrl: null,
        }));
    }

    /**
     * Format Real-Time News articles
     */
    formatRealtimeArticles(articles) {
        return articles.map(article => ({
            title: article.title || '',
            snippet: article.snippet || article.description || '',
            source: article.source_name || article.source || 'Unknown',
            link: article.link || article.url || '',
            date: article.published_datetime || new Date().toISOString(),
            imageUrl: article.photo_url || null,
        }));
    }

    /**
     * Format article for ingestion
     */
    formatArticleForIngestion(article, trustScore = null) {
        return {
            text: `${article.title}\n\n${article.snippet}`,
            metadata: {
                source: article.source,
                title: article.title,
                url: article.link,
                date: article.date,
                provider: 'rapidapi',
                trustScore: trustScore,
            }
        };
    }
}

module.exports = new RapidAPINewsService();
