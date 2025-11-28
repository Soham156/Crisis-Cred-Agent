const axios = require('axios');
const cheerio = require('cheerio');
const Parser = require('rss-parser');
const vectorStoreService = require('./vector-store.service');
const config = require('../config');
const logger = require('../utils/logger');

class DataIngestionService {
    constructor() {
        this.rssParser = new Parser();
    }

    /**
     * Ingest all data sources
     */
    async ingestAllSources() {
        try {
            logger.info('Starting data ingestion from all sources...');

            await Promise.allSettled([
                this.ingestPIBFactCheck(),
                this.ingestRSSFeeds(),
                this.ingestNewsDataAPI(),
                this.ingestNewsAPI(),
                this.ingestGoogleNews(),
                this.ingestSampleData(),
            ]);

            const stats = await vectorStoreService.getStats();
            logger.info('Data ingestion completed', stats);
        } catch (error) {
            logger.error('Error in data ingestion:', error);
        }
    }

    /**
     * Ingest PIB Fact Check articles
     */
    async ingestPIBFactCheck() {
        try {
            logger.info('Ingesting PIB Fact Check data...');

            const url = config.dataSources.pibFactCheck;
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                },
            });

            const $ = cheerio.load(response.data);
            const documents = [];

            // Extract fact-check articles (adjust selectors based on actual site structure)
            $('.content-area article, .fact-check-item').each((i, elem) => {
                const title = $(elem).find('h2, h3, .title').first().text().trim();
                const content = $(elem).find('p, .content').text().trim();
                const link = $(elem).find('a').first().attr('href');

                if (title && content) {
                    documents.push({
                        text: `${title}\n\n${content}`,
                        metadata: {
                            source: 'PIB Fact Check',
                            title: title,
                            url: link ? (link.startsWith('http') ? link : url + link) : url,
                            date: new Date().toISOString(),
                        },
                    });
                }
            });

            if (documents.length > 0) {
                await vectorStoreService.addDocuments(documents);
                logger.info(`Ingested ${documents.length} PIB fact-check articles`);
            } else {
                logger.warn('No PIB fact-check articles found');
            }
        } catch (error) {
            logger.error('Error ingesting PIB data:', error.message);
        }
    }

    /**
     * Ingest RSS feeds
     */
    async ingestRSSFeeds() {
        try {
            const feeds = config.dataSources.rssFeeds;

            if (!feeds || feeds.length === 0) {
                logger.info('No RSS feeds configured');
                return;
            }

            logger.info(`Ingesting ${feeds.length} RSS feeds...`);

            for (const feedUrl of feeds) {
                try {
                    const feed = await this.rssParser.parseURL(feedUrl);
                    const documents = [];

                    feed.items.slice(0, 20).forEach(item => {
                        const text = `${item.title}\n\n${item.contentSnippet || item.content || ''}`;

                        documents.push({
                            text: text,
                            metadata: {
                                source: feed.title || 'RSS Feed',
                                title: item.title,
                                url: item.link,
                                date: item.pubDate || new Date().toISOString(),
                            },
                        });
                    });

                    if (documents.length > 0) {
                        await vectorStoreService.addDocuments(documents);
                        logger.info(`Ingested ${documents.length} articles from ${feed.title}`);
                    }
                } catch (error) {
                    logger.error(`Error parsing RSS feed ${feedUrl}:`, error.message);
                }
            }
        } catch (error) {
            logger.error('Error ingesting RSS feeds:', error);
        }
    }

    /**
     * Ingest news from NewsData.io API
     */
    async ingestNewsDataAPI() {
        try {
            const apiKey = config.dataSources.newsDataApiKey;
            const apiUrl = config.dataSources.newsDataApiUrl;

            if (!apiKey) {
                logger.info('NewsData.io API key not configured, skipping');
                return;
            }

            logger.info('Ingesting news from NewsData.io...');

            const response = await axios.get(apiUrl, {
                params: {
                    apikey: apiKey,
                    language: 'en',
                    category: 'top,health,science,politics',
                },
                timeout: 10000,
            });

            if (!response.data || !response.data.results) {
                logger.warn('No results from NewsData.io API');
                return;
            }

            const documents = [];
            const articles = response.data.results.slice(0, 30); // Limit to 30 articles

            articles.forEach(article => {
                if (article.title && article.description) {
                    const text = `${article.title}\n\n${article.description || ''}\n\n${article.content || ''}`;

                    documents.push({
                        text: text.trim(),
                        metadata: {
                            source: article.source_id || 'NewsData.io',
                            title: article.title,
                            url: article.link,
                            date: article.pubDate || new Date().toISOString(),
                            category: article.category ? article.category.join(', ') : 'general',
                            country: article.country ? article.country.join(', ') : 'unknown',
                        },
                    });
                }
            });

            if (documents.length > 0) {
                await vectorStoreService.addDocuments(documents);
                logger.info(`Ingested ${documents.length} articles from NewsData.io`);
            }
        } catch (error) {
            logger.error('Error ingesting NewsData.io:', error.message);
        }
    }

    /**
     * Ingest news from NewsAPI.org
     */
    async ingestNewsAPI() {
        try {
            const apiKey = config.dataSources.newsApiKey;
            const apiUrl = config.dataSources.newsApiUrl;

            if (!apiKey) {
                logger.info('NewsAPI.org key not configured, skipping');
                return;
            }

            logger.info('Ingesting news from NewsAPI.org...');

            const response = await axios.get(apiUrl, {
                params: {
                    apiKey: apiKey,
                    country: 'in', // India-specific news
                    category: 'general,health,science,technology',
                    pageSize: 50,
                },
                timeout: 10000,
            });

            if (!response.data || !response.data.articles) {
                logger.warn('No results from NewsAPI.org');
                return;
            }

            const documents = [];
            const articles = response.data.articles;

            articles.forEach(article => {
                if (article.title && article.description) {
                    const text = `${article.title}\n\n${article.description || ''}\n\n${article.content || ''}`;

                    documents.push({
                        text: text.trim(),
                        metadata: {
                            source: article.source?.name || 'NewsAPI.org',
                            title: article.title,
                            url: article.url,
                            date: article.publishedAt || new Date().toISOString(),
                            author: article.author || 'Unknown',
                            country: 'India',
                        },
                    });
                }
            });

            if (documents.length > 0) {
                await vectorStoreService.addDocuments(documents);
                logger.info(`Ingested ${documents.length} articles from NewsAPI.org`);
            }
        } catch (error) {
            logger.error('Error ingesting NewsAPI.org:', error.message);
        }
    }

    /**
     * Ingest news from Google News via SerpAPI with verification
     */
    async ingestGoogleNews(query = 'fact check OR misinformation OR verification') {
        try {
            const googleNewsService = require('./google-news.service');
            const sourceVerificationService = require('./source-verification.service');
            const config = require('../config');

            if (!config.serpapi.apiKey) {
                logger.info('SerpAPI key not configured, skipping Google News ingestion');
                return;
            }

            logger.info('Ingesting news from Google News with verification...');

            // Search for relevant news articles
            const articles = await googleNewsService.searchNews(query);

            if (!articles || articles.length === 0) {
                logger.warn('No articles found from Google News');
                return;
            }

            logger.info(`Found ${articles.length} articles from Google News, verifying...`);

            const documents = [];
            let verifiedCount = 0;
            let rejectedCount = 0;

            // Verify each article
            for (const article of articles) {
                try {
                    // Verify article (source + content)
                    const verification = await sourceVerificationService.verifyArticle(article);

                    // Only include if it passes verification
                    if (verification.shouldInclude) {
                        const document = googleNewsService.formatArticleForIngestion(
                            article,
                            verification.trustScore
                        );
                        documents.push(document);
                        verifiedCount++;

                        logger.info(`✓ Verified: ${article.title} (Trust: ${verification.trustScore})`);
                    } else {
                        rejectedCount++;
                        logger.info(`✗ Rejected: ${article.title} (Trust: ${verification.trustScore})`);
                    }
                } catch (error) {
                    logger.error(`Error verifying article "${article.title}":`, error.message);
                    rejectedCount++;
                }
            }

            // Add verified documents to vector store
            if (documents.length > 0) {
                await vectorStoreService.addDocuments(documents);
                logger.info(`Ingested ${documents.length} verified articles from Google News`);
                logger.info(`Verification summary: ${verifiedCount} verified, ${rejectedCount} rejected`);
            } else {
                logger.warn('No articles passed verification from Google News');
            }
        } catch (error) {
            logger.error('Error ingesting Google News:', error.message);
        }
    }

    /**
     * Add sample fact-check data for testing
     */
    async ingestSampleData() {
        try {
            logger.info('Adding sample fact-check data...');

            const sampleData = [
                {
                    text: 'COVID-19 Fact Check: Drinking hot water does NOT cure COVID-19. There is no scientific evidence supporting this claim. The virus can only be prevented through vaccination and following health protocols.',
                    metadata: {
                        source: 'WHO',
                        title: 'Hot water does not cure COVID-19',
                        url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters',
                        date: '2023-01-15',
                    },
                },
                {
                    text: '5G networks do NOT spread COVID-19. Viruses cannot travel on radio waves or mobile networks. COVID-19 is spreading in many countries that do not have 5G mobile networks.',
                    metadata: {
                        source: 'WHO',
                        title: '5G mobile networks do not spread COVID-19',
                        url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters',
                        date: '2023-01-15',
                    },
                },
                {
                    text: 'Vaccines are safe and effective. COVID-19 vaccines have undergone rigorous testing and monitoring. They significantly reduce the risk of severe illness and death.',
                    metadata: {
                        source: 'WHO',
                        title: 'COVID-19 vaccines are safe',
                        url: 'https://www.who.int/news-room/questions-and-answers/item/coronavirus-disease-(covid-19)-vaccines',
                        date: '2023-06-01',
                    },
                },
                {
                    text: 'Climate change is real and caused by human activities. The scientific consensus is clear: global warming is primarily caused by greenhouse gas emissions from human activities.',
                    metadata: {
                        source: 'IPCC',
                        title: 'Climate Change 2023',
                        url: 'https://www.ipcc.ch/',
                        date: '2023-03-20',
                    },
                },
                {
                    text: 'Drinking adequate water is important for health, but there is no evidence that it cures diseases. Water helps maintain bodily functions but is not a cure for viral infections.',
                    metadata: {
                        source: 'Health Advisory',
                        title: 'Water and Health',
                        url: 'https://www.who.int/news-room/fact-sheets/detail/drinking-water',
                        date: '2023-05-10',
                    },
                },
            ];

            await vectorStoreService.addDocuments(sampleData);
            logger.info(`Added ${sampleData.length} sample fact-check entries`);
        } catch (error) {
            logger.error('Error adding sample data:', error);
        }
    }

    /**
     * Schedule periodic data updates
     */
    scheduleUpdates() {
        const updateInterval = config.app.cacheTtlHours * 60 * 60 * 1000; // Convert hours to ms

        logger.info(`Scheduling data updates every ${config.app.cacheTtlHours} hours`);

        // Initial ingestion
        this.ingestAllSources();

        // Periodic updates
        setInterval(() => {
            logger.info('Running scheduled data update...');
            this.ingestAllSources();
        }, updateInterval);
    }
}

module.exports = new DataIngestionService();
