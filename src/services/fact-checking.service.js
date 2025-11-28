const llmService = require('./llm.service');
const vectorStoreService = require('./vector-store.service');
const googleNewsService = require('./google-news.service');
const rapidAPINewsService = require('./rapidapi-news.service');
const tavilySearchService = require('./tavily-search.service');
const sourceVerificationService = require('./source-verification.service');
const { FACT_CHECKING_SYSTEM_PROMPT } = require('../prompts');
const logger = require('../utils/logger');

class FactCheckingService {
    /**
     * Verify a claim using RAG pipeline with multiple search APIs
     */
    async verifyClaim(claimText) {
        try {
            logger.info('Verifying claim', { claim: claimText });

            // Step 1: Search multiple news APIs in parallel
            logger.info('Searching multiple news APIs for claim-specific articles');

            const [serpApiArticles, rapidApiArticles, tavilyArticles] = await Promise.allSettled([
                googleNewsService.searchForClaim(claimText),
                rapidAPINewsService.searchForClaim(claimText),
                tavilySearchService.searchForClaim(claimText),
            ]);

            // Combine all articles
            const allArticles = [
                ...(serpApiArticles.status === 'fulfilled' ? serpApiArticles.value : []),
                ...(rapidApiArticles.status === 'fulfilled' ? rapidApiArticles.value : []),
                ...(tavilyArticles.status === 'fulfilled' ? tavilyArticles.value : []),
            ];

            logger.info(`Found ${allArticles.length} total articles from all APIs`);

            let verifiedArticles = [];
            if (allArticles.length > 0) {
                logger.info('Verifying sources with AI (Parallel)...');

                // Step 2: Verify top articles in parallel (limit to 5)
                const articlesToVerify = allArticles.slice(0, 5);

                const verificationPromises = articlesToVerify.map(async (article) => {
                    try {
                        const verification = await sourceVerificationService.verifyArticle(article);
                        if (verification.shouldInclude) {
                            return {
                                text: `${article.title}\n\n${article.snippet}`,
                                metadata: {
                                    source: article.source,
                                    title: article.title,
                                    url: article.link,
                                    trustScore: verification.trustScore,
                                    answer: article.answer || null,
                                }
                            };
                        }
                    } catch (error) {
                        logger.warn(`Error verifying article: ${error.message}`);
                    }
                    return null;
                });

                const results = await Promise.all(verificationPromises);
                verifiedArticles = results.filter(r => r !== null);

                logger.info(`Verified ${verifiedArticles.length} articles from news APIs`);
            }

            // Step 3: Also retrieve from vector store (pre-ingested data)
            const vectorStoreSources = await vectorStoreService.searchSimilar(claimText, 3);

            // Step 4: Combine both sources (prioritize verified news)
            const allSources = [...verifiedArticles, ...vectorStoreSources];
            const relevantSources = allSources.slice(0, 5); // Top 5 total

            // Build context from sources
            const context = this.buildContext(relevantSources);

            // Generate verdict using LLM
            const verdict = await this.generateVerdict(claimText, context);

            // Extract source links
            const sources = this.extractSources(relevantSources);

            return {
                ...verdict,
                sources,
                sourcesFound: relevantSources.length,
                newsAPIsUsed: allArticles.length,
                verifiedCount: verifiedArticles.length,
            };
        } catch (error) {
            logger.error('Fact-checking error:', error);

            // Return unverified verdict on error
            return {
                verdict: 'UNVERIFIED',
                explanation: 'Unable to verify this claim due to insufficient data or technical issues.',
                correctedInfo: null,
                confidence: 0,
                sources: [],
                sourcesFound: 0,
            };
        }
    }

    /**
     * Build context from retrieved sources
     */
    buildContext(sources) {
        if (!sources || sources.length === 0) {
            return 'No relevant sources found in the database.';
        }

        let context = 'Relevant information from trusted sources:\n\n';

        sources.forEach((source, index) => {
            context += `Source ${index + 1}:\n`;
            context += `${source.text}\n`;

            if (source.metadata?.source) {
                context += `(Source: ${source.metadata.source})\n`;
            }

            context += `\n`;
        });

        return context;
    }

    /**
     * Generate verdict using LLM
     */
    async generateVerdict(claimText, context) {
        try {
            const userPrompt = `Claim to verify: "${claimText}"\n\n${context}\n\nProvide your fact-check verdict in JSON format.`;

            const response = await llmService.generate(
                FACT_CHECKING_SYSTEM_PROMPT,
                userPrompt,
                { temperature: 0.2, maxTokens: 1000 }
            );

            // Parse JSON response
            const verdict = this.parseVerdictResponse(response);

            logger.info('Verdict generated', {
                claim: claimText,
                verdict: verdict.verdict,
                confidence: verdict.confidence
            });

            return verdict;
        } catch (error) {
            logger.error('Error generating verdict:', error);

            return {
                verdict: 'UNVERIFIED',
                explanation: 'Unable to generate a verdict at this time.',
                correctedInfo: null,
                confidence: 0,
            };
        }
    }

    /**
     * Parse LLM verdict response
     */
    parseVerdictResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\{[\s\S]*\}/);

            if (!jsonMatch) {
                logger.warn('No JSON found in verdict response');
                return this.getDefaultVerdict();
            }

            const verdict = JSON.parse(jsonMatch[0]);

            // Validate verdict structure
            if (!verdict.verdict || !verdict.explanation) {
                logger.warn('Invalid verdict structure');
                return this.getDefaultVerdict();
            }

            // Normalize verdict
            verdict.verdict = verdict.verdict.toUpperCase();
            verdict.confidence = verdict.confidence || 50;
            verdict.correctedInfo = verdict.correctedInfo || null;

            return verdict;
        } catch (error) {
            logger.error('Error parsing verdict response:', error);
            return this.getDefaultVerdict();
        }
    }

    /**
     * Get default verdict for errors
     */
    getDefaultVerdict() {
        return {
            verdict: 'UNVERIFIED',
            explanation: 'Unable to verify this claim with available information.',
            correctedInfo: null,
            confidence: 0,
        };
    }

    /**
     * Extract source links from metadata
     */
    extractSources(relevantSources) {
        return relevantSources
            .filter(source => source.metadata?.url)
            .map(source => ({
                title: source.metadata.title || 'Source',
                url: source.metadata.url,
                source: source.metadata.source || 'Unknown',
            }))
            .slice(0, 3); // Limit to top 3 sources
    }
}

module.exports = new FactCheckingService();
