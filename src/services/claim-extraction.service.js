const llmService = require('./llm.service');
const { CLAIM_EXTRACTION_SYSTEM_PROMPT } = require('../prompts');
const config = require('../config');
const logger = require('../utils/logger');

class ClaimExtractionService {
    /**
     * Extract verifiable claims from text
     */
    async extractClaims(text) {
        try {
            logger.info('Extracting claims from text', { textLength: text.length });

            const userPrompt = `Extract all verifiable factual claims from the following message:\n\n"${text}"`;

            const response = await llmService.generate(
                CLAIM_EXTRACTION_SYSTEM_PROMPT,
                userPrompt,
                { temperature: 0.3, maxTokens: 800 }
            );

            // Parse JSON response
            const claims = this.parseClaimsResponse(response);

            // Limit number of claims
            const maxClaims = config.app.maxClaimsPerMessage;
            const limitedClaims = claims.slice(0, maxClaims);

            logger.info(`Extracted ${claims.length} claims, processing ${limitedClaims.length}`, {
                claims: limitedClaims.map(c => c.text),
            });

            return limitedClaims;
        } catch (error) {
            logger.error('Claim extraction error:', error);
            throw error;
        }
    }

    /**
     * Parse LLM response and extract claims
     */
    parseClaimsResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/\[[\s\S]*\]/);

            if (!jsonMatch) {
                logger.warn('No JSON array found in response', { response });
                return [];
            }

            const claims = JSON.parse(jsonMatch[0]);

            // Validate claims structure
            if (!Array.isArray(claims)) {
                logger.warn('Response is not an array', { response });
                return [];
            }

            // Filter and validate claims
            return claims.filter(claim => {
                return claim.text &&
                    typeof claim.text === 'string' &&
                    claim.text.trim().length > 0;
            });

        } catch (error) {
            logger.error('Error parsing claims response:', error);
            return [];
        }
    }
}

module.exports = new ClaimExtractionService();
