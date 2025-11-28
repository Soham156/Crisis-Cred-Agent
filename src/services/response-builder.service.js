const logger = require('../utils/logger');

class ResponseBuilderService {
    /**
     * Build evidence card for WhatsApp
     */
    buildEvidenceCard(claim, verificationResult) {
        const { verdict, explanation, correctedInfo, confidence, sources, sourcesFound } = verificationResult;

        let message = '';

        // Header with verdict emoji
        message += this.getVerdictHeader(verdict) + '\n\n';

        // Claim
        message += `📋 *Claim:*\n${claim}\n\n`;

        // Verdict
        message += `✅ *Verdict:* ${verdict}\n`;
        message += `📊 *Confidence:* ${confidence}%\n\n`;

        // Explanation
        message += `💡 *Explanation:*\n${explanation}\n\n`;

        // Corrected information (if available)
        if (correctedInfo) {
            message += `✏️ *Correct Information:*\n${correctedInfo}\n\n`;
        }

        // Sources
        if (sources && sources.length > 0) {
            message += `📚 *Sources:*\n`;
            sources.forEach((source, index) => {
                message += `${index + 1}. ${source.title}\n`;
                message += `   ${source.url}\n`;
            });
            message += '\n';
        } else if (sourcesFound === 0) {
            message += `⚠️ *Note:* No sources found in database. This verdict is based on general knowledge.\n\n`;
        }

        // Footer
        message += `━━━━━━━━━━━━━━━\n`;
        message += `🤖 Crisis Cred - Misinformation Detection\n`;
        message += `⚠️ Always verify important information from multiple trusted sources.`;

        return message;
    }

    /**
     * Get verdict header with emoji
     */
    getVerdictHeader(verdict) {
        switch (verdict) {
            case 'TRUE':
                return '✅ *VERIFIED AS TRUE*';
            case 'FALSE':
                return '❌ *VERIFIED AS FALSE*';
            case 'PARTIALLY TRUE':
                return '⚠️ *PARTIALLY TRUE*';
            case 'UNVERIFIED':
                return '❓ *UNVERIFIED*';
            default:
                return '❓ *VERIFICATION RESULT*';
        }
    }

    /**
     * Format message for WhatsApp (handle length limits)
     */
    formatForWhatsApp(message) {
        const MAX_LENGTH = 4096; // WhatsApp message limit

        if (message.length <= MAX_LENGTH) {
            return [message];
        }

        // Split into multiple messages if too long
        const messages = [];
        let currentMessage = '';

        const lines = message.split('\n');

        for (const line of lines) {
            if ((currentMessage + line + '\n').length > MAX_LENGTH) {
                messages.push(currentMessage.trim());
                currentMessage = line + '\n';
            } else {
                currentMessage += line + '\n';
            }
        }

        if (currentMessage.trim()) {
            messages.push(currentMessage.trim());
        }

        return messages;
    }

    /**
     * Build error message
     */
    buildErrorMessage(error) {
        return `❌ *Error*\n\nSorry, we encountered an error while processing your request.\n\nPlease try again later or contact support if the issue persists.`;
    }

    /**
     * Build welcome message
     */
    buildWelcomeMessage() {
        return `👋 *Welcome to Crisis Cred!*\n\n` +
            `I'm your AI-powered fact-checker. Send me any claim or message, and I'll verify it against trusted sources.\n\n` +
            `📝 *How to use:*\n` +
            `• Send any text message with a claim\n` +
            `• Send an image with a caption\n` +
            `• I'll analyze and fact-check the claims\n\n` +
            `⚠️ *Note:* Audio and video support coming soon!\n\n` +
            `Let's fight misinformation together! 🛡️`;
    }
}

module.exports = new ResponseBuilderService();
