# Crisis Cred - WhatsApp Misinformation Detection System

A powerful AI-powered fact-checking system that works directly inside WhatsApp. Crisis Cred receives messages via WhatsApp Cloud API, extracts claims, verifies them using a RAG (Retrieval-Augmented Generation) pipeline with trusted sources, and responds with evidence-based verdicts.

## 🌟 Features

- **WhatsApp Integration**: Seamless integration with WhatsApp Cloud API
- **Multi-Format Support**: Text messages, images with captions (audio/video coming soon)
- **AI-Powered Claim Extraction**: Uses LLaMA 3.1 to identify verifiable claims
- **RAG-Based Fact-Checking**: Retrieves relevant information from trusted sources
- **Evidence Cards**: Beautiful, formatted responses with verdicts and sources
- **Trusted Sources**: PIB Fact Check, WHO advisories, news RSS feeds
- **Real-time Processing**: Fast, asynchronous message processing

## 🏗️ Architecture

```
WhatsApp Message → Webhook → Claim Extraction (LLM) → RAG Pipeline → Fact-Checking (LLM) → Evidence Card → WhatsApp Response
```

### Components

1. **WhatsApp Service**: Handles webhook verification, message parsing, and sending responses
2. **LLM Service**: Interfaces with LLaMA 3.1 via HuggingFace Router
3. **Claim Extraction**: Identifies factual claims from user messages
4. **Vector Store**: ChromaDB for storing and retrieving trusted sources
5. **Fact-Checking**: RAG pipeline that verifies claims against sources
6. **Response Builder**: Formats evidence cards for WhatsApp

## 📋 Prerequisites

- Node.js 16+ and npm
- WhatsApp Business Account and Cloud API access
- HuggingFace account and API token
- ChromaDB (optional, runs in fallback mode without it)

## 🚀 Quick Start

### 1. Clone and Install

```bash
cd "d:\Crisis Cred Node"
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```env
# WhatsApp Cloud API (from Meta for Developers)
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token

# HuggingFace (already configured)
HF_TOKEN=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
```

### 3. Set Up WhatsApp Cloud API

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Add WhatsApp product
4. Get your Phone Number ID and Access Token
5. Configure webhook URL: `https://your-domain.com/webhook`
6. Set verify token (same as in `.env`)
7. Subscribe to `messages` webhook field

### 4. Run ChromaDB (Optional)

```bash
# Using Docker
docker run -p 8000:8000 chromadb/chroma

# Or install locally
pip install chromadb
chroma run --path ./chroma_data
```

If ChromaDB is not available, the system will run in fallback mode using sample data.

### 5. Start the Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## 🌐 Production Deployment

### Deploy to Vercel (Serverless)

**Quick Deploy:**
```bash
npm install -g vercel
vercel --prod
```

**Important**: Vercel has timeout limitations (10s free, 60s pro). See [VERCEL-DEPLOYMENT.md](VERCEL-DEPLOYMENT.md) for complete guide.

### Alternative Platforms (Recommended for Full Features)

For ChromaDB support and no timeout limits:

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

**Render:**
1. Connect your GitHub repository
2. Create new Web Service
3. Set environment variables
4. Deploy

**DigitalOcean App Platform:**
1. Connect repository
2. Configure environment
3. Deploy

📖 **Full deployment guide**: [VERCEL-DEPLOYMENT.md](VERCEL-DEPLOYMENT.md)

## 📡 API Endpoints

### Health Check
```
GET /health
```

### Webhook Verification
```
GET /webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=CHALLENGE
```

### Receive Messages
```
POST /webhook
```

## 🔧 Configuration

Edit `src/config/index.js` or use environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Phone Number ID | - |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Access Token | - |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verification token | - |
| `HF_TOKEN` | HuggingFace API token | - |
| `HF_MODEL` | LLM model name | meta-llama/Llama-3.1-8B-Instruct:novita |
| `CHROMA_HOST` | ChromaDB host | localhost |
| `CHROMA_PORT` | ChromaDB port | 8000 |
| `MAX_CLAIMS_PER_MESSAGE` | Max claims to verify per message | 3 |
| `CONFIDENCE_THRESHOLD` | Minimum confidence for verdicts | 0.7 |

## 📱 Usage

1. **Send a text message** to your WhatsApp Business number with a claim
2. **Wait for analysis** - you'll get an acknowledgment message
3. **Receive evidence card** with verdict, explanation, and sources

### Example

**User sends:**
```
Drinking hot water cures COVID-19
```

**Crisis Cred responds:**
```
❌ VERIFIED AS FALSE

📋 Claim:
Drinking hot water cures COVID-19

✅ Verdict: FALSE
📊 Confidence: 95%

💡 Explanation:
There is no scientific evidence that drinking hot water cures COVID-19...

✏️ Correct Information:
COVID-19 can only be prevented through vaccination and following health protocols...

📚 Sources:
1. Hot water does not cure COVID-19
   https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters

━━━━━━━━━━━━━━━
🤖 Crisis Cred - Misinformation Detection
⚠️ Always verify important information from multiple trusted sources.
```

## 🗂️ Project Structure

```
Crisis Cred Node/
├── server.js                          # Main Express server
├── package.json                       # Dependencies
├── .env                              # Environment variables
├── src/
│   ├── config/
│   │   └── index.js                  # Configuration
│   ├── controllers/
│   │   └── webhook.controller.js     # Webhook handlers
│   ├── routes/
│   │   └── webhook.routes.js         # API routes
│   ├── services/
│   │   ├── whatsapp.service.js       # WhatsApp API
│   │   ├── llm.service.js            # LLM integration
│   │   ├── claim-extraction.service.js
│   │   ├── vector-store.service.js   # ChromaDB
│   │   ├── fact-checking.service.js  # RAG pipeline
│   │   ├── response-builder.service.js
│   │   └── data-ingestion.service.js # Source scraping
│   ├── prompts/
│   │   └── index.js                  # LLM prompts
│   ├── middleware/
│   │   └── error-handler.js          # Error handling
│   └── utils/
│       └── logger.js                 # Winston logger
└── logs/                             # Log files
```

## 🔍 How It Works

1. **Message Reception**: WhatsApp sends webhook POST request with message data
2. **Message Parsing**: Extract text, media URLs, and metadata
3. **Claim Extraction**: LLM identifies verifiable claims from the text
4. **Source Retrieval**: Vector database finds relevant trusted sources
5. **Fact-Checking**: LLM analyzes claim against retrieved sources
6. **Response Generation**: Format evidence card with verdict and sources
7. **WhatsApp Reply**: Send formatted message back to user

## 🧪 Testing

### Expose Your Local Server to the Internet

For WhatsApp Cloud API to send webhooks to your local machine, you need to expose it to the internet using a tunneling service.

**📖 See [TUNNELING.md](TUNNELING.md) for detailed setup instructions**

**Quick Start:**

```bash
# Install dependencies
npm install

# Start with ngrok (recommended)
npm run tunnel

# Or start with localtunnel (no signup required)
npm run tunnel:localtunnel
```

The script will automatically:
1. Start your Express server
2. Create a public tunnel
3. Display your webhook URL

Copy the webhook URL and use it in your WhatsApp Cloud API configuration.

### Test Claim Extraction

Send test messages with various claims to verify the system works correctly.

## 📊 Data Sources

The system ingests data from:

- **PIB Fact Check**: Government fact-checking portal
- **WHO Advisories**: Health information from WHO
- **RSS Feeds**: Configurable news feeds
- **Sample Data**: Pre-loaded common fact-checks

Data is automatically refreshed every 24 hours (configurable).

## 🚨 Error Handling

- Graceful fallback if ChromaDB is unavailable
- Comprehensive error logging with Winston
- User-friendly error messages
- Automatic retry mechanisms

## 🔐 Security

- Environment variables for sensitive data
- Webhook verification token
- Request validation
- Rate limiting (recommended for production)

## 📈 Future Enhancements

- [ ] Speech-to-text for audio/video messages
- [ ] Multi-language support
- [ ] User feedback loop
- [ ] Admin dashboard
- [ ] Analytics and reporting
- [ ] More data sources
- [ ] Caching layer for faster responses

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC

## 🆘 Support

For issues or questions:
- Check the logs in `logs/` directory
- Review WhatsApp Cloud API documentation
- Verify environment variables are set correctly

## 🙏 Acknowledgments

- Meta for WhatsApp Cloud API
- HuggingFace for LLM access
- ChromaDB for vector storage
- OpenAI for the SDK

---

Built with ❤️ to fight misinformation
