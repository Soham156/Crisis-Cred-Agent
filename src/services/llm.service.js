const { GoogleGenAI } = require('@google/genai');
const { OpenAI } = require('openai');
const config = require('../config');
const logger = require('../utils/logger');

class LLMService {
    constructor() {
        // Initialize Gemini client
        if (config.llm.gemini.apiKey) {
            this.geminiClient = new GoogleGenAI({
                apiKey: config.llm.gemini.apiKey,
            });
            logger.info('Gemini AI client initialized');
        }

        // Initialize HuggingFace client (fallback)
        if (config.llm.huggingface.token) {
            this.hfClient = new OpenAI({
                baseURL: config.llm.huggingface.baseUrl,
                apiKey: config.llm.huggingface.token,
            });
            logger.info('HuggingFace client initialized');
        }

        this.primaryProvider = config.llm.primaryProvider;
    }

    /**
     * Generate completion using primary provider with fallback
     */
    async generate(systemPrompt, userPrompt, options = {}) {
        const usePrimary = this.primaryProvider === 'gemini' && this.geminiClient;

        try {
            if (usePrimary) {
                return await this.generateWithGemini(systemPrompt, userPrompt, options);
            } else {
                return await this.generateWithHuggingFace(systemPrompt, userPrompt, options);
            }
        } catch (error) {
            logger.error(`Error with ${usePrimary ? 'Gemini' : 'HuggingFace'}:`, error.message);

            // Fallback to secondary provider
            if (usePrimary && this.hfClient) {
                logger.info('Falling back to HuggingFace...');
                return await this.generateWithHuggingFace(systemPrompt, userPrompt, options);
            } else if (!usePrimary && this.geminiClient) {
                logger.info('Falling back to Gemini...');
                return await this.generateWithGemini(systemPrompt, userPrompt, options);
            }

            throw error;
        }
    }

    /**
     * Generate completion using Google Gemini
     */
    async generateWithGemini(systemPrompt, userPrompt, options = {}) {
        try {
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

            const response = await this.geminiClient.models.generateContent({
                model: config.llm.gemini.model,
                contents: fullPrompt,
            });

            const text = response.text;
            logger.info('Gemini completion generated', {
                model: config.llm.gemini.model,
                responseLength: text.length
            });

            return text;
        } catch (error) {
            logger.error('Gemini generation error:', error);
            throw error;
        }
    }

    /**
     * Generate completion using HuggingFace (LLaMA)
     */
    async generateWithHuggingFace(systemPrompt, userPrompt, options = {}) {
        try {
            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ];

            const completion = await this.hfClient.chat.completions.create({
                model: config.llm.huggingface.model,
                messages: messages,
                temperature: options.temperature || config.llm.temperature,
                max_tokens: options.maxTokens || config.llm.maxTokens,
            });

            const response = completion.choices[0].message.content;
            logger.info('HuggingFace completion generated', {
                model: config.llm.huggingface.model,
                tokensUsed: completion.usage?.total_tokens
            });

            return response;
        } catch (error) {
            logger.error('HuggingFace generation error:', error);
            throw error;
        }
    }

    /**
     * Get current provider info
     */
    getProviderInfo() {
        return {
            primary: this.primaryProvider,
            geminiAvailable: !!this.geminiClient,
            huggingfaceAvailable: !!this.hfClient,
        };
    }
}

module.exports = new LLMService();
