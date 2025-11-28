const whatsappService = require('../services/whatsapp.service');
const claimExtractionService = require('../services/claim-extraction.service');
const factCheckingService = require('../services/fact-checking.service');
const responseBuilder = require('../services/response-builder.service');
const logger = require('../utils/logger');

class WebhookController {
    /**
     * POST /webhook - Handle incoming Twilio WhatsApp messages
     * Twilio uses POST for all webhooks (no GET verification needed)
     */
    async handleIncomingMessage(req, res) {
        try {
            // TEMPORARY: Signature verification disabled for localtunnel testing
            // TODO: Re-enable for production deployment
            logger.info('Webhook received - signature check bypassed for testing');

            // Acknowledge receipt immediately (Twilio expects quick response)
            res.status(200).send('OK');

            // Parse incoming message
            const messageData = whatsappService.parseIncomingMessage(req.body);

            if (!messageData) {
                logger.warn('No valid message data found');
                return;
            }

            // Process message asynchronously
            this.processMessage(messageData).catch(error => {
                logger.error('Error processing message:', error);
            });

        } catch (error) {
            logger.error('Webhook handler error:', error);
            res.status(500).send('Internal Server Error');
        }
    }

    /**
     * Process message and generate fact-check response
     */
    async processMessage(messageData) {
        try {
            const { from, type, text, mediaUrl, mediaType } = messageData;
            let messageText = text;

            // Send initial acknowledgment
            await whatsappService.sendMessage(
                from,
                '🔍 Analyzing your message for fact-checking. Please wait...'
            );

            // Handle media messages
            if (type === 'media') {
                if (mediaType && mediaType.startsWith('image/')) {
                    // For images, use the caption if available
                    if (text) {
                        messageText = text;
                    } else {
                        await whatsappService.sendMessage(
                            from,
                            '📷 Image received. Please include a caption with the claim you want to fact-check.'
                        );
                        return;
                    }
                } else {
                    // Audio/video not supported yet
                    await whatsappService.sendMessage(
                        from,
                        '⚠️ Audio and video transcription will be available soon. Please send text messages for now.'
                    );
                    return;
                }
            }

            if (!messageText) {
                await whatsappService.sendMessage(
                    from,
                    '❌ No text found in your message. Please send a text message or image with caption.'
                );
                return;
            }

            // Extract claims
            logger.info('Extracting claims from message', { from });
            const claims = await claimExtractionService.extractClaims(messageText);

            if (!claims || claims.length === 0) {
                await whatsappService.sendMessage(
                    from,
                    '❓ No verifiable claims found in your message. Please send a message with factual claims that can be checked.'
                );
                return;
            }

            logger.info(`Found ${claims.length} claim(s)`, { from });

            // Fact-check each claim
            for (const claim of claims) {
                logger.info('Fact-checking claim', { claim: claim.text });

                const verificationResult = await factCheckingService.verifyClaim(claim.text);

                // Build and send evidence card
                const evidenceCard = responseBuilder.buildEvidenceCard(
                    claim.text,
                    verificationResult
                );

                await whatsappService.sendMessage(from, evidenceCard);
            }

        } catch (error) {
            logger.error('Error in processMessage:', error);

            // Send error message to user
            try {
                await whatsappService.sendMessage(
                    messageData.from,
                    '❌ Sorry, an error occurred while processing your message. Please try again later.'
                );
            } catch (sendError) {
                logger.error('Error sending error message:', sendError);
            }
        }
    }

    /**
     * GET /health - Health check endpoint
     */
    async healthCheck(req, res) {
        res.status(200).json({
            status: 'ok',
            service: 'Crisis Cred - Twilio WhatsApp',
            timestamp: new Date().toISOString(),
        });
    }
}

module.exports = new WebhookController();
