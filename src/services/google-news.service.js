const { getJson } = require("serpapi");
const config = require('../config');
const logger = require('../utils/logger');

class GoogleNewsService {
    /**
     * Search Google News for articles related to a query
     * @param {string} query - Search query
     * @param {object} options - Search options
     * @returns {Promise<Array>} Array of formatted articles
     */
    async searchNews(query, options = {}) {
        try {
            if (!config.serpapi.apiKey) {
                logger.warn('SerpAPI key not configured, skipping Google News search');
                return [];
            }

            logger.info('Searching Google News', { query });

            const searchParams = {
                engine: config.serpapi.searchEngine,
                q: query,
                api_key: config.serpapi.apiKey,
                tbm: "nws", // News search
                num: options.limit || config.serpapi.newsResultsLimit,
                ...options.additionalParams
            };

            return new Promise((resolve, reject) => {
                getJson(searchParams, (json) => {
                    if (json.error) {
                        logger.error('SerpAPI error:', json.error);
                        reject(new Error(json.error));
                        return;
                    }

                    const articles = this.parseNewsResults(json);
                    logger.info(`Found ${articles.length} news articles from Google News`);
                    resolve(articles);
                });
            });
        } catch (error) {
            logger.error('Error searching Google News:', error);
            return [];
        }
    }

    /**
     * Parse SerpAPI news results
     * @param {object} results - Raw SerpAPI response
     * @returns {Array} Parsed articles
     */
    parseNewsResults(results) {
        try {
            if (!results.news_results || results.news_results.length === 0) {
                logger.warn('No news results found in SerpAPI response');
                return [];
            }

            return results.news_results.map(article => ({
                title: article.title || '',
                snippet: article.snippet || '',
                link: article.link || '',
                source: article.source || 'Unknown',
                date: article.date || new Date().toISOString(),
                thumbnail: article.thumbnail || null,
                position: article.position || 0
            }));
        } catch (error) {
            logger.error('Error parsing news results:', error);
            return [];
        }
    }

    /**
     * Format article for ingestion into vector store
     * @param {object} article - Parsed article
     * @param {number} trustScore - Trust score from verification (0-100)
     * @returns {object} Document ready for vector store
     */
    formatArticleForIngestion(article, trustScore = 0) {
        const text = `${article.title}\n\n${article.snippet}`;

        return {
            text: text.trim(),
            metadata: {
                source: article.source,
                title: article.title,
                url: article.link,
                date: article.date,
                trustScore: trustScore,
                verifiedAt: new Date().toISOString(),
                category: 'google_news',
            }
        };
    }

    /**
     * Search news for a specific claim
     * @param {string} claim - Claim to search for
     * @returns {Promise<Array>} Relevant news articles
     */
    async searchForClaim(claim) {
        try {
            // Extract key terms from claim for better search
            const searchQuery = this.optimizeSearchQuery(claim);

            return await this.searchNews(searchQuery, {
                limit: 5,
                additionalParams: {
                    tbs: 'qdr:m' // Last month for recent news
                }
            });
        } catch (error) {
            logger.error('Error searching news for claim:', error);
            return [];
        }
    }

    /**
     * Optimize search query from claim text
     * @param {string} claim - Original claim
     * @returns {string} Optimized search query
     */
    optimizeSearchQuery(claim) {
        // Remove common filler words and keep key terms
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had'];

        const words = claim.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.includes(word));

        // Take first 5-7 most relevant words
        return words.slice(0, 7).join(' ');
    }

    /**
     * Get trending news topics
     * @param {string} category - News category (optional)
     * @returns {Promise<Array>} Trending articles
     */
    async getTrendingNews(category = '') {
        try {
            const query = category || 'fact check OR misinformation OR verification';

            return await this.searchNews(query, {
                limit: config.serpapi.newsResultsLimit,
                additionalParams: {
                    tbs: 'qdr:d' // Last day
                }
            });
        } catch (error) {
            logger.error('Error getting trending news:', error);
            return [];
        }
    }
}

module.exports = new GoogleNewsService();
