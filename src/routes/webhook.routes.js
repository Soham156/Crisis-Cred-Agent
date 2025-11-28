const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhook.controller');

// POST /webhook - Handle incoming Twilio WhatsApp messages
router.post('/', (req, res) => webhookController.handleIncomingMessage(req, res));

// GET /health - Health check
router.get('/health', (req, res) => webhookController.healthCheck(req, res));

module.exports = router;
