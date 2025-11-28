const { ChromaClient } = require('chromadb');
const config = require('../config');
const logger = require('../utils/logger');

class VectorStoreService {
    constructor() {
        this.client = null;
        this.collection = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Chroma client and collection
     */
    async initialize() {
        try {
            if (this.isInitialized) {
                return;
            }

            logger.info('Initializing Chroma vector store...');

            this.client = new ChromaClient({
                path: `http://${config.chroma.host}:${config.chroma.port}`,
            });

            // Get or create collection
            try {
                this.collection = await this.client.getOrCreateCollection({
                    name: config.chroma.collectionName,
                    metadata: { description: 'Fact-checking sources and verified information' },
                });

                logger.info('Chroma collection ready', {
                    name: config.chroma.collectionName,
                });
            } catch (error) {
                logger.warn('Chroma not available, using fallback mode', { error: error.message });
                this.collection = null;
            }

            this.isInitialized = true;
        } catch (error) {
            logger.error('Error initializing vector store:', error);
            // Continue without vector store - will use fallback
            this.collection = null;
            this.isInitialized = true;
        }
    }

    /**
     * Add documents to vector store
     */
    async addDocuments(documents) {
        await this.initialize();

        if (!this.collection) {
            logger.warn('Vector store not available, skipping document addition');
            return;
        }

        try {
            const ids = documents.map((_, i) => `doc_${Date.now()}_${i}`);
            const texts = documents.map(doc => doc.text);
            const metadatas = documents.map(doc => doc.metadata || {});

            await this.collection.add({
                ids,
                documents: texts,
                metadatas,
            });

            logger.info(`Added ${documents.length} documents to vector store`);
        } catch (error) {
            logger.error('Error adding documents:', error);
        }
    }

    /**
     * Search for similar documents
     */
    async searchSimilar(query, limit = 5) {
        await this.initialize();

        if (!this.collection) {
            logger.warn('Vector store not available, returning empty results');
            return [];
        }

        try {
            const results = await this.collection.query({
                queryTexts: [query],
                nResults: limit,
            });

            const documents = results.documents[0] || [];
            const metadatas = results.metadatas[0] || [];
            const distances = results.distances[0] || [];

            const formattedResults = documents.map((doc, i) => ({
                text: doc,
                metadata: metadatas[i],
                similarity: 1 - (distances[i] || 0), // Convert distance to similarity
            }));

            logger.info(`Found ${formattedResults.length} similar documents`, { query });
            return formattedResults;
        } catch (error) {
            logger.error('Error searching documents:', error);
            return [];
        }
    }

    /**
     * Get collection stats
     */
    async getStats() {
        await this.initialize();

        if (!this.collection) {
            return { count: 0, available: false };
        }

        try {
            const count = await this.collection.count();
            return { count, available: true };
        } catch (error) {
            logger.error('Error getting stats:', error);
            return { count: 0, available: false };
        }
    }
}

module.exports = new VectorStoreService();
