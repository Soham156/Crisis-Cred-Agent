# WhatsApp Cloud API Setup Guide

This guide will walk you through setting up WhatsApp Cloud API for Crisis Cred.

## Prerequisites

- Facebook Business Account
- Phone number for WhatsApp Business
- A publicly accessible HTTPS URL for webhook (use ngrok for local testing)

## Step 1: Create Meta for Developers Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "Get Started" and create an account
3. Complete the registration process

## Step 2: Create a New App

1. Click "My Apps" in the top navigation
2. Click "Create App"
3. Select "Business" as the app type
4. Fill in app details:
   - **App Name**: Crisis Cred (or your preferred name)
   - **Contact Email**: Your email
   - **Business Account**: Select or create one
5. Click "Create App"

## Step 3: Add WhatsApp Product

1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set Up" on the WhatsApp card
3. You'll be taken to the WhatsApp setup page

## Step 4: Get Your Credentials

### Phone Number ID

1. In the WhatsApp setup page, go to "API Setup"
2. You'll see a test phone number provided by Meta
3. Copy the **Phone Number ID** (looks like: `123456789012345`)
4. Add it to your `.env` file:
   ```env
   WHATSAPP_PHONE_NUMBER_ID=123456789012345
   ```

### Access Token

1. In the same "API Setup" section, you'll see a **Temporary Access Token**
2. Copy this token (valid for 24 hours for testing)
3. Add it to your `.env` file:
   ```env
   WHATSAPP_ACCESS_TOKEN=your_temporary_token
   ```

**Note**: For production, you'll need to generate a permanent token:
- Go to "System Users" in Business Settings
- Create a system user
- Generate a token with `whatsapp_business_messaging` permission

## Step 5: Configure Webhook

### 5.1 Set Up ngrok (for local testing)

1. Download [ngrok](https://ngrok.com/)
2. Run your Crisis Cred server:
   ```bash
   npm start
   ```
3. In another terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```
4. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 5.2 Configure Webhook in Meta

1. In WhatsApp setup page, go to "Configuration"
2. Click "Edit" next to "Webhook"
3. Enter your webhook details:
   - **Callback URL**: `https://your-domain.com/webhook` (or ngrok URL)
   - **Verify Token**: Create a random string (e.g., `my_verify_token_12345`)
4. Add the verify token to your `.env`:
   ```env
   WHATSAPP_VERIFY_TOKEN=my_verify_token_12345
   ```
5. Click "Verify and Save"

### 5.3 Subscribe to Webhook Fields

1. After webhook is verified, scroll down to "Webhook fields"
2. Click "Manage" next to your phone number
3. Subscribe to the **messages** field
4. Click "Done"

## Step 6: Test the Integration

### 6.1 Send a Test Message

1. In the "API Setup" section, you'll see "Send and receive messages"
2. Add your personal WhatsApp number as a recipient
3. You'll receive a code on WhatsApp to verify
4. Once verified, send a test message from your phone to the test number

### 6.2 Verify Webhook Reception

1. Check your server logs for incoming webhook requests
2. You should see:
   ```
   [info]: POST /webhook
   [info]: Message parsed { from: '1234567890', type: 'text', messageId: '...' }
   ```

## Step 7: Production Setup

### 7.1 Get a Permanent Phone Number

1. Go to "Phone Numbers" in WhatsApp setup
2. Click "Add Phone Number"
3. Follow the verification process
4. Update your `WHATSAPP_PHONE_NUMBER_ID` in `.env`

### 7.2 Generate Permanent Access Token

1. Go to Business Settings → System Users
2. Create a new system user
3. Add the user to your app
4. Generate a token with these permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Save the token securely and update `.env`

### 7.3 Deploy Your Server

1. Deploy to a hosting platform (Render, Railway, Heroku, etc.)
2. Ensure your server has HTTPS enabled
3. Update the webhook URL in Meta for Developers
4. Test the production webhook

## Step 8: Business Verification (Optional)

For production use with unlimited messaging:

1. Go to Business Settings → Business Info
2. Complete business verification
3. Submit required documents
4. Wait for Meta's approval (can take several days)

## Troubleshooting

### Webhook Verification Fails

- Ensure your server is running and accessible via HTTPS
- Check that `WHATSAPP_VERIFY_TOKEN` matches in both `.env` and Meta dashboard
- Verify the webhook URL is correct (should end with `/webhook`)

### Messages Not Received

- Check webhook subscriptions (must include "messages")
- Verify your phone number is registered as a recipient
- Check server logs for errors
- Ensure access token is valid

### "Invalid Access Token" Error

- Temporary tokens expire after 24 hours
- Generate a permanent token for production
- Verify token has correct permissions

### Rate Limiting

- Free tier has message limits
- Verify your business for higher limits
- Implement exponential backoff for retries

## Environment Variables Summary

After completing setup, your `.env` should have:

```env
# WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_VERIFY_TOKEN=my_verify_token_12345
WHATSAPP_API_VERSION=v18.0

# HuggingFace LLM
HF_TOKEN=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
HF_MODEL=meta-llama/Llama-3.1-8B-Instruct:novita
HF_BASE_URL=https://router.huggingface.co/v1

# Server
PORT=3000
NODE_ENV=development
```

## Next Steps

1. Test with various message types
2. Monitor logs for errors
3. Set up ChromaDB for better fact-checking
4. Add more trusted data sources
5. Deploy to production

## Resources

- [WhatsApp Cloud API Documentation](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta for Developers](https://developers.facebook.com/)
- [WhatsApp Business Platform](https://business.whatsapp.com/products/business-platform)

---

Need help? Check the main [README.md](./README.md) or review server logs in `logs/` directory.
