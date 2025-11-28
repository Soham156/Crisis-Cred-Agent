const llmService = require('./llm.service');
const { SOURCE_TRUSTWORTHINESS_PROMPT, ARTICLE_ACCURACY_PROMPT } = require('../prompts');
const config = require('../config');
const logger = require('../utils/logger');

class SourceVerificationService {
    constructor() {
        // List of highly trusted sources
        this.trustedSources = [
            'reuters', 'associated press', 'ap news', 'bbc', 'who', 'world health organization',
            'pib', 'press information bureau', 'the guardian', 'the new york times',
            'washington post', 'nature', 'science', 'the lancet', 'bmj', 'cdc',
            'centers for disease control', 'government', 'fact check', 'snopes',
            'politifact', 'factcheck.org', 'altnews', 'boom live'
        ];

        // List of known unreliable sources
        this.unreliableSources = [
            'infowars', 'natural news', 'before it\'s news', 'yournewswire',
            'the onion', 'clickhole', 'satirical', 'parody'
        ];
    }

    /**
     * Verify if a news source is trustworthy
     * @param {object} sourceMetadata - Source information (name, url, etc.)
     * @returns {Promise<object>} Verification result with trust score
     */
    async verifySource(sourceMetadata) {
        try {
            const sourceName = sourceMetadata.source || sourceMetadata.name || 'Unknown';
            logger.info('Verifying source trustworthiness', { source: sourceName });

            // Quick check against known lists
            const quickCheck = this.quickSourceCheck(sourceName);
            if (quickCheck.definitive) {
                logger.info('Quick source check result', quickCheck);
                return quickCheck;
            }

            // Use LLM for detailed assessment
            const llmAssessment = await this.llmSourceAssessment(sourceName, sourceMetadata);

            return {
                ...llmAssessment,
                source: sourceName,
                verifiedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error verifying source:', error);
            return this.getDefaultSourceVerdict(sourceMetadata.source);
        }
    }

    /**
     * Quick check against known trusted/untrusted sources
     * @param {string} sourceName - Name of the source
     * @returns {object} Quick check result
     */
    quickSourceCheck(sourceName) {
        const lowerSource = sourceName.toLowerCase();

        // Check if highly trusted
        const isTrusted = this.trustedSources.some(trusted =>
            lowerSource.includes(trusted)
        );

        if (isTrusted) {
            return {
                definitive: true,
                trustworthy: true,
                trustScore: 95,
                reasoning: 'Source is on the list of highly trusted news organizations',
                category: 'highly_trusted'
            };
        }

        // Check if known unreliable
        const isUnreliable = this.unreliableSources.some(unreliable =>
            lowerSource.includes(unreliable)
        );

        if (isUnreliable) {
            return {
                definitive: true,
                trustworthy: false,
                trustScore: 10,
                reasoning: 'Source is known for misinformation or satire',
                category: 'unreliable'
            };
        }

        return { definitive: false };
    }

    /**
     * Use LLM to assess source trustworthiness
     * @param {string} sourceName - Name of the source
     * @param {object} metadata - Additional metadata
     * @returns {Promise<object>} LLM assessment
     */
    async llmSourceAssessment(sourceName, metadata) {
        try {
            const userPrompt = `Assess the trustworthiness of this news source:\n\nSource Name: ${sourceName}\nURL: ${metadata.url || 'N/A'}\n\nProvide your assessment in JSON format.`;

            const response = await llmService.generate(
                SOURCE_TRUSTWORTHINESS_PROMPT,
                userPrompt,
                { temperature: 0.2, maxTokens: 500 }
            );

            const assessment = this.parseVerificationResponse(response);
            logger.info('LLM source assessment', { source: sourceName, assessment });

            return assessment;
        } catch (error) {
            logger.error('Error in LLM source assessment:', error);
            return this.getDefaultSourceVerdict(sourceName);
        }
    }

    /**
     * Verify article content for accuracy indicators
     * @param {string} articleContent - Article title and snippet
     * @param {string} sourceName - Name of the source
     * @returns {Promise<object>} Accuracy assessment
     */
    async verifyArticleAccuracy(articleContent, sourceName) {
        try {
            logger.info('Verifying article accuracy', { source: sourceName });

            const userPrompt = `Analyze this news article for accuracy indicators:\n\nSource: ${sourceName}\nContent: ${articleContent}\n\nProvide your assessment in JSON format.`;

            const response = await llmService.generate(
                ARTICLE_ACCURACY_PROMPT,
                userPrompt,
                { temperature: 0.2, maxTokens: 600 }
            );

            const assessment = this.parseVerificationResponse(response);
            logger.info('Article accuracy assessment', { source: sourceName, score: assessment.accuracyScore });

            return assessment;
        } catch (error) {
            logger.error('Error verifying article accuracy:', error);
            return {
                accuracyScore: 50,
                hasRedFlags: false,
                redFlags: [],
                reasoning: 'Unable to assess accuracy',
                recommendation: 'review'
            };
        }
    }

    /**
     * Calculate overall trust score combining source and content
     * @param {object} sourceVerification - Source verification result
     * @param {object} accuracyVerification - Accuracy verification result
     * @returns {number} Overall trust score (0-100)
     */
    calculateTrustScore(sourceVerification, accuracyVerification) {
        // Weight: 60% source trustworthiness, 40% content accuracy
        const sourceTrust = sourceVerification.trustScore || 50;
        const contentAccuracy = accuracyVerification.accuracyScore || 50;

        const overallScore = Math.round((sourceTrust * 0.6) + (contentAccuracy * 0.4));

        logger.info('Calculated trust score', {
            source: sourceTrust,
            content: contentAccuracy,
            overall: overallScore
        });

        return overallScore;
    }

    /**
     * Determine if article should be included in RAG pipeline
     * @param {number} trustScore - Overall trust score
     * @param {object} accuracyVerification - Accuracy verification result
     * @returns {boolean} Whether to include article
     */
    shouldIncludeInRAG(trustScore, accuracyVerification) {
        const threshold = config.serpapi.trustScoreThreshold || 70;

        // Exclude if has red flags regardless of score
        if (accuracyVerification.hasRedFlags && accuracyVerification.redFlags.length > 2) {
            logger.info('Excluding article due to multiple red flags');
            return false;
        }

        // Exclude if below threshold
        if (trustScore < threshold) {
            logger.info('Excluding article due to low trust score', { score: trustScore, threshold });
            return false;
        }

        return true;
    }

    /**
     * Verify complete article (source + content)
     * @param {object} article - Article with title, snippet, source
     * @returns {Promise<object>} Complete verification result
     */
    async verifyArticle(article) {
        try {
            // Verify source
            const sourceVerification = await this.verifySource({
                source: article.source,
                url: article.link
            });

            // Verify content accuracy
            const articleContent = `${article.title}\n\n${article.snippet}`;
            const accuracyVerification = await this.verifyArticleAccuracy(
                articleContent,
                article.source
            );

            // Calculate overall trust score
            const trustScore = this.calculateTrustScore(
                sourceVerification,
                accuracyVerification
            );

            // Determine if should include
            const shouldInclude = this.shouldIncludeInRAG(
                trustScore,
                accuracyVerification
            );

            return {
                article,
                sourceVerification,
                accuracyVerification,
                trustScore,
                shouldInclude,
                verifiedAt: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Error verifying article:', error);
            return {
                article,
                trustScore: 0,
                shouldInclude: false,
                error: error.message
            };
        }
    }

    /**
     * Parse LLM verification response
     * @param {string} response - LLM response
     * @returns {object} Parsed verification
     */
    parseVerificationResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn('No JSON found in verification response');
                return this.getDefaultVerdict();
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            logger.error('Error parsing verification response:', error);
            return this.getDefaultVerdict();
        }
    }

    /**
     * Get default source verdict
     * @param {string} sourceName - Source name
     * @returns {object} Default verdict
     */
    getDefaultSourceVerdict(sourceName) {
        return {
            trustworthy: false,
            trustScore: 50,
            reasoning: 'Unable to verify source trustworthiness',
            category: 'neutral',
            source: sourceName
        };
    }

    /**
     * Get default verification verdict
     * @returns {object} Default verdict
     */
    getDefaultVerdict() {
        return {
            trustScore: 50,
            reasoning: 'Unable to complete verification',
            category: 'neutral'
        };
    }
}

module.exports = new SourceVerificationService();
