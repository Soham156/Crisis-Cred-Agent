const { tavily } = require("@tavily/core");
const config = require('../config');
const logger = require('../utils/logger');

class TavilySearchService {
    constructor() {
        if (config.tavily && config.tavily.apiKey) {
            this.client = tavily({ apiKey: config.tavily.apiKey });
            this.enabled = true;
        } else {
            this.enabled = false;
            logger.warn('Tavily API key not configured');
        }
    }

    /**
     * Search for news and information using Tavily AI
     */
    async search(query, options = {}) {
        if (!this.enabled) {
            logger.warn('Tavily search skipped - API key not configured');
            return [];
        }

        try {
            logger.info('Searching with Tavily AI', { query });

            const response = await this.client.search(query, {
                searchDepth: options.searchDepth || 'advanced',
                maxResults: options.maxResults || 5,
                includeAnswer: true,
                includeRawContent: false,
                includeDomains: options.includeDomains || [],
                excludeDomains: options.excludeDomains || [],
            });

            logger.info(`Tavily found ${response.results?.length || 0} results`);

            return this.formatResults(response);
        } catch (error) {
            logger.error('Tavily search error:', error.message);
            return [];
        }
    }

    /**
     * Search specifically for fact-checking a claim
     */
    async searchForClaim(claim) {
        const query = `fact check: ${claim}`;

        const results = await this.search(query, {
            searchDepth: 'advanced',
            maxResults: 5,
            includeDomains: [
                'reuters.com',
                'apnews.com',
                'factcheck.org',
                'snopes.com',
                'politifact.com',
                'bbc.com',
                'who.int'
            ]
        });

        return results;
    }

    /**
     * Format Tavily results to match our article structure
     */
    formatResults(response) {
        if (!response.results || response.results.length === 0) {
            return [];
        }

        return response.results.map(result => ({
            title: result.title,
            snippet: result.content || '',
            source: this.extractDomain(result.url),
            link: result.url,
            date: result.publishedDate || new Date().toISOString(),
            score: result.score || 0,
            answer: response.answer || null, // Tavily's AI-generated answer
        }));
    }

    /**
     * Extract domain name from URL
     */
    extractDomain(url) {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        } catch {
            return 'Unknown';
        }
    }

    /**
     * Format article for ingestion into vector store
     */
    formatArticleForIngestion(article, trustScore = null) {
        return {
            text: `${article.title}\n\n${article.snippet}`,
            metadata: {
                source: article.source,
                title: article.title,
                url: article.link,
                date: article.date,
                provider: 'tavily',
                trustScore: trustScore,
                score: article.score,
            }
        };
    }
}

module.exports = new TavilySearchService();
