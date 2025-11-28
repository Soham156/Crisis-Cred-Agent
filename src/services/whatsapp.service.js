const twilio = require('twilio');
const config = require('../config');
const logger = require('../utils/logger');

class WhatsAppService {
    constructor() {
        this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
        this.whatsappNumber = config.twilio.whatsappNumber;
    }

    /**
     * Verify Twilio webhook signature
     * @param {string} signature - X-Twilio-Signature header
     * @param {string} url - Full webhook URL
     * @param {object} params - Request body parameters
     * @returns {boolean} Whether signature is valid
     */
    verifyWebhook(signature, url, params) {
        try {
            const isValid = twilio.validateRequest(
                config.twilio.authToken,
                signature,
                url,
                params
            );

            if (isValid) {
                logger.info('Twilio webhook signature verified successfully');
            } else {
                logger.warn('Twilio webhook signature verification failed');
            }

            return isValid;
        } catch (error) {
            logger.error('Error verifying Twilio webhook:', error);
            return false;
        }
    }

    /**
     * Parse incoming Twilio WhatsApp message
     * @param {object} body - Twilio webhook body (form data)
     * @returns {object|null} Parsed message data
     */
    parseIncomingMessage(body) {
        try {
            // Twilio sends data as form fields, not nested JSON
            const from = body.From; // Format: whatsapp:+1234567890
            const to = body.To;
            const messageBody = body.Body;
            const messageSid = body.MessageSid;
            const numMedia = parseInt(body.NumMedia) || 0;

            if (!from || !messageSid) {
                logger.warn('Invalid Twilio message format');
                return null;
            }

            const messageData = {
                from: from.replace('whatsapp:', ''), // Remove whatsapp: prefix
                messageId: messageSid,
                timestamp: new Date().toISOString(),
                type: numMedia > 0 ? 'media' : 'text',
                text: messageBody || null,
                mediaUrl: null,
                mediaType: null,
                numMedia: numMedia,
            };

            // Handle media messages
            if (numMedia > 0) {
                messageData.mediaUrl = body.MediaUrl0; // First media item
                messageData.mediaType = body.MediaContentType0;
            }

            logger.info('Twilio message parsed', {
                from: messageData.from,
                type: messageData.type,
                messageId: messageSid
            });

            return messageData;

        } catch (error) {
            logger.error('Error parsing Twilio message:', error);
            return null;
        }
    }

    /**
     * Send WhatsApp message via Twilio
     * @param {string} to - Recipient phone number (without whatsapp: prefix)
     * @param {string} message - Message text
     * @returns {Promise<object>} Twilio message response
     */
    async sendMessage(to, message) {
        try {
            // Ensure phone number has whatsapp: prefix
            const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

            const response = await this.client.messages.create({
                body: message,
                from: this.whatsappNumber,
                to: formattedTo,
            });

            logger.info('Twilio message sent successfully', {
                to: formattedTo,
                messageSid: response.sid
            });

            return response;

        } catch (error) {
            logger.error('Error sending Twilio message:', error.message);
            throw error;
        }
    }

    /**
     * Send WhatsApp message with media
     * @param {string} to - Recipient phone number
     * @param {string} message - Message text
     * @param {string} mediaUrl - URL of media to send
     * @returns {Promise<object>} Twilio message response
     */
    async sendMediaMessage(to, message, mediaUrl) {
        try {
            const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

            const response = await this.client.messages.create({
                body: message,
                from: this.whatsappNumber,
                to: formattedTo,
                mediaUrl: [mediaUrl],
            });

            logger.info('Twilio media message sent successfully', {
                to: formattedTo,
                messageSid: response.sid
            });

            return response;

        } catch (error) {
            logger.error('Error sending Twilio media message:', error.message);
            throw error;
        }
    }

    /**
     * Get message status
     * @param {string} messageSid - Twilio message SID
     * @returns {Promise<object>} Message details
     */
    async getMessageStatus(messageSid) {
        try {
            const message = await this.client.messages(messageSid).fetch();

            logger.info('Message status retrieved', {
                sid: messageSid,
                status: message.status
            });

            return {
                sid: message.sid,
                status: message.status,
                errorCode: message.errorCode,
                errorMessage: message.errorMessage,
            };

        } catch (error) {
            logger.error('Error getting message status:', error.message);
            throw error;
        }
    }

    /**
     * Download media from Twilio
     * @param {string} mediaUrl - Media URL from Twilio
     * @returns {Promise<Buffer>} Media file buffer
     */
    async downloadMedia(mediaUrl) {
        try {
            const axios = require('axios');

            // Twilio media URLs require authentication
            const response = await axios.get(mediaUrl, {
                auth: {
                    username: config.twilio.accountSid,
                    password: config.twilio.authToken,
                },
                responseType: 'arraybuffer',
            });

            logger.info('Media downloaded successfully', { mediaUrl });
            return Buffer.from(response.data);

        } catch (error) {
            logger.error('Error downloading media:', error.message);
            throw error;
        }
    }

    /**
     * Format phone number for WhatsApp
     * @param {string} phoneNumber - Phone number
     * @returns {string} Formatted number with whatsapp: prefix
     */
    formatWhatsAppNumber(phoneNumber) {
        // Remove any existing whatsapp: prefix
        const cleanNumber = phoneNumber.replace('whatsapp:', '');

        // Ensure number starts with +
        const formattedNumber = cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;

        return `whatsapp:${formattedNumber}`;
    }
}

module.exports = new WhatsAppService();
