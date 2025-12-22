# Crisis Cred Agent - AI-Powered WhatsApp Misinformation Detection

An intelligent AI-powered fact-checking system that operates directly through WhatsApp via Twilio. Crisis Cred Agent receives messages, extracts verifiable claims using advanced LLMs, validates them through a sophisticated RAG (Retrieval-Augmented Generation) pipeline with real-time news searches, and responds with evidence-based verdicts backed by credible sources.

## 📖 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Services](#-api-services)
- [Development](#-development)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [How It Works](#-how-it-works)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Features

### Core Capabilities

- **🔗 WhatsApp Integration**: Seamless Twilio WhatsApp API integration with webhook support
- **🤖 Multi-LLM Support**: Google Gemini 2.5 Flash (primary) with HuggingFace LLaMA fallback
- **📝 Intelligent Claim Extraction**: AI-powered extraction of verifiable claims from user messages
- **✅ RAG-Based Fact-Checking**: Advanced Retrieval-Augmented Generation for accurate verification
- **🔍 Multi-Source Search**: Parallel searches across Google News (SerpAPI), RapidAPI News, and Tavily
- **🛡️ AI-Powered Source Verification**: Automated credibility assessment of articles before inclusion
- **💬 Rich Evidence Cards**: Beautifully formatted responses with verdicts, confidence scores, and sources
- **📊 Vector Database**: ChromaDB integration for persistent knowledge storage
- **⚡ Real-Time Processing**: Fast asynchronous message handling with parallel API calls
- **📱 Media Support**: Text messages and images with captions
- **🔄 Auto-Ingestion**: Scheduled data updates from trusted sources (disabled in serverless)
- **📝 Comprehensive Logging**: Winston-based structured logging for debugging and monitoring
- **☁️ Serverless Ready**: Optimized for Vercel deployment with serverless functions

### Intelligent Processing

- Parallel news search across multiple providers for comprehensive coverage
- AI-driven source credibility verification before including in fact-check
- Dynamic confidence scoring based on evidence quality
- Graceful fallback mechanisms when services are unavailable
- Rate limiting and error handling for all external APIs

## 🏗️ Architecture

```
┌─────────────┐
│   WhatsApp  │
│    (User)   │
└──────┬──────┘
       │ Message
       ▼
┌─────────────────────┐
│  Twilio Webhook     │
│  /webhook (POST)    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│  Claim Extraction   │◄────── LLM Service (Gemini/LLaMA)
│  (AI Analysis)      │
└──────┬──────────────┘
       │ Extracted Claims
       ▼
┌─────────────────────────────────────────┐
│         RAG Pipeline (Parallel)         │
│  ┌────────────┬──────────────┬─────────┐│
│  │  SerpAPI   │  RapidAPI    │ Tavily  ││
│  │   News     │    News      │ Search  ││
│  └─────┬──────┴──────┬───────┴────┬────┘│
└────────┼─────────────┼────────────┼─────┘
         │             │            │
         └─────────────┴────────────┘
                       │
                       ▼
         ┌──────────────────────────┐
         │  Source Verification     │◄────── AI Credibility Check
         │  (AI Analysis)           │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │   Fact-Checking LLM      │◄────── RAG Context
         │   (Verdict Generation)   │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │   Response Builder       │
         │   (Evidence Card)        │
         └────────────┬─────────────┘
                      │
                      ▼
         ┌──────────────────────────┐
         │   WhatsApp Response      │
         │   (via Twilio)           │
         └──────────────────────────┘
```

## 🛠️ Tech Stack

### Backend Framework

- **Node.js** (16+) with **Express.js** - Fast, minimal web framework
- **Twilio** - WhatsApp Business API integration

### AI & Machine Learning

- **Google Gemini 2.5 Flash** - Primary LLM for claim extraction and fact-checking
- **Meta LLaMA 3.3 70B** - Fallback LLM via HuggingFace Router
- **LangChain** - LLM orchestration and chain management
- **ChromaDB** - Vector database for knowledge storage and retrieval

### News & Search APIs

- **SerpAPI** - Google News search integration
- **RapidAPI** - Real-time news search
- **Tavily** - AI-powered web search

### Development Tools

- **Winston** - Structured logging
- **dotenv** - Environment variable management
- **Nodemon** - Development auto-reload
- **Ngrok/Localtunnel** - Local webhook tunneling

### Deployment

- **Vercel** - Serverless deployment platform
- **Docker** - ChromaDB containerization (optional)

## 📋 Prerequisites

Before setting up Crisis Cred Agent, ensure you have:

### Required

- **Node.js** 16.x or higher and npm
- **Twilio Account** with WhatsApp enabled
- **Google Gemini API Key** (free tier available at [Google AI Studio](https://makersuite.google.com/app/apikey))
- **At least one search API**:
  - SerpAPI Key ([serpapi.com](https://serpapi.com/))
  - RapidAPI Key ([rapidapi.com](https://rapidapi.com/))
  - Tavily API Key ([tavily.com](https://tavily.com/))

### Optional

- **HuggingFace Token** - For LLaMA fallback (free at [huggingface.co](https://huggingface.co/settings/tokens))
- **ChromaDB** - For persistent vector storage (Docker or local installation)
- **Ngrok** - For local development tunneling

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/crisis-cred-agent.git
cd crisis-cred-agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Variables](#-environment-variables) section).

### 4. (Optional) Set Up ChromaDB

#### Using Docker

```bash
docker run -d -p 8000:8000 --name chromadb chromadb/chroma
```

#### Using Python

```bash
pip install chromadb
chroma run --path ./chroma_data --port 8000
```

If ChromaDB is unavailable, the system operates in fallback mode.

## ⚙️ Configuration

### Twilio WhatsApp Setup

1. **Create Twilio Account**: Sign up at [twilio.com](https://www.twilio.com/)
2. **Get WhatsApp Sandbox**: Navigate to Messaging → Try it out → Send a WhatsApp message
3. **Configure Webhook**:
   - Go to Messaging → Settings → WhatsApp sandbox settings
   - Set webhook URL: `https://your-domain.com/webhook` (POST)
   - Save configuration
4. **Get Credentials**:
   - Account SID: Dashboard → Account Info
   - Auth Token: Dashboard → Account Info
   - WhatsApp Number: Format `whatsapp:+14155238886`

### LLM Configuration

The system uses a **dual-LLM strategy**:

**Primary: Google Gemini 2.5 Flash**

- Fast responses (typically < 2 seconds)
- Free tier: 1500 requests/day
- Model: `gemini-2.5-flash`

**Fallback: HuggingFace LLaMA 3.3 70B**

- Activated if Gemini fails
- Requires HuggingFace API token
- Model: `meta-llama/Llama-3.3-70B-Instruct:novita`

Set `PRIMARY_LLM=gemini` or `PRIMARY_LLM=huggingface` in `.env`.

## 🔌 API Services

### Search & News APIs

The system performs **parallel searches** across multiple providers:

#### 1. SerpAPI (Google News)

```env
SERPAPI_KEY=your_serpapi_key
```

- Provides Google News results
- Best for comprehensive coverage
- Get key: [serpapi.com](https://serpapi.com/)

#### 2. RapidAPI (Real-time News)

```env
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_REALTIME_KEY=your_realtime_news_key
```

- Real-time news search
- International coverage
- Get key: [rapidapi.com](https://rapidapi.com/)

#### 3. Tavily Search

```env
TAVILY_API_KEY=your_tavily_key
```

- AI-optimized search
- Reliable fact-checking sources
- Get key: [tavily.com](https://tavily.com/)

**Note**: At least one search API is required. The system combines results from all available APIs.

## 💻 Development

### Start Development Server

```bash
# Start with auto-reload
npm run dev

# Production mode
npm start

# Start server at http://localhost:3000
```

### Local Tunnel for Webhook Testing

For testing webhooks locally without deploying:

```bash
# Using Ngrok (recommended)
npm run tunnel:ngrok

# Using Localtunnel (alternative)
npm run tunnel:localtunnel

# Or manually with Ngrok
ngrok http 3000
```

Copy the generated URL and configure it as your Twilio webhook endpoint.

### Running Tests

```bash
# Run test suite (when implemented)
npm test
```

## 🚀 Deployment

### Vercel (Serverless)

**Quick Deploy**:

```bash
npm install -g vercel
vercel login
vercel --prod
```

**Important Limitations**:

- 10-second timeout (free tier) / 60-second (pro)
- No ChromaDB support (in-memory fallback)
- Scheduled data ingestion disabled
- Best for testing and demo purposes

**Configuration**: The project includes `vercel.json` for automatic serverless setup.

### Railway (Recommended for Production)

Full feature support including ChromaDB:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Add environment variables in Railway dashboard.

### Render

1. Connect GitHub repository at [render.com](https://render.com)
2. Create new Web Service
3. Set environment variables
4. Deploy automatically on git push

### DigitalOcean App Platform

1. Connect repository
2. Configure environment variables
3. Select Node.js buildpack
4. Deploy

### Docker Deployment

```bash
# Build image
docker build -t crisis-cred-agent .

# Run container
docker run -p 3000:3000 --env-file .env crisis-cred-agent
```

## 📂 Project Structure

```
crisis-cred-agent/
├── api/
│   └── index.js                 # Vercel serverless function entry
├── logs/                        # Application logs
├── scripts/
│   ├── start-with-ngrok.js     # Ngrok tunnel launcher
│   └── start-with-localtunnel.js
├── src/
│   ├── config/
│   │   └── index.js            # Centralized configuration
│   ├── controllers/
│   │   └── webhook.controller.js # Webhook request handlers
│   ├── middleware/
│   │   └── error-handler.js    # Global error handling
│   ├── prompts/
│   │   └── index.js            # LLM system prompts
│   ├── routes/
│   │   └── webhook.routes.js   # Express routes
│   ├── services/
│   │   ├── claim-extraction.service.js    # Extract claims from text
│   │   ├── data-ingestion.service.js      # Scheduled data updates
│   │   ├── fact-checking.service.js       # RAG fact verification
│   │   ├── google-news.service.js         # SerpAPI integration
│   │   ├── llm.service.js                 # LLM orchestration
│   │   ├── rapidapi-news.service.js       # RapidAPI integration
│   │   ├── response-builder.service.js    # Format WhatsApp responses
│   │   ├── source-verification.service.js # AI credibility check
│   │   ├── tavily-search.service.js       # Tavily search integration
│   │   ├── vector-store.service.js        # ChromaDB operations
│   │   └── whatsapp.service.js            # Twilio API wrapper
│   └── utils/
│       └── logger.js           # Winston logging configuration
├── .env                        # Environment variables (create this)
├── .env.example                # Environment template
├── package.json                # Dependencies and scripts
├── server.js                   # Main application entry
├── start-tunnel.bat            # Windows tunnel launcher
└── vercel.json                 # Vercel deployment config
```

## 🌐 API Endpoints

### GET /health

Health check endpoint for monitoring.

**Response**:

```json
{
  "status": "ok",
  "timestamp": "2025-12-22T10:30:00.000Z",
  "uptime": 3600
}
```

### POST /webhook

Receives incoming WhatsApp messages from Twilio.

**Request Body** (Twilio format):

```json
{
  "From": "whatsapp:+1234567890",
  "Body": "Is climate change real?",
  "MediaUrl0": "https://...",
  "MediaContentType0": "image/jpeg"
}
```

**Processing Flow**:

1. Parse incoming message
2. Extract claims using LLM
3. Search multiple news APIs in parallel
4. Verify source credibility with AI
5. Perform RAG-based fact-checking
6. Generate evidence card
7. Send response via Twilio

## 🔍 How It Works

### 1. Message Reception

When a user sends a WhatsApp message, Twilio forwards it to `/webhook` as a POST request.

### 2. Claim Extraction

The LLM analyzes the message and extracts up to 3 verifiable factual claims:

```javascript
// Example extracted claim
{
  "text": "Drinking hot water cures COVID-19",
  "category": "health",
  "priority": "high"
}
```

### 3. Parallel News Search

The system searches three APIs simultaneously:

- **SerpAPI**: Google News results
- **RapidAPI**: Real-time news articles
- **Tavily**: AI-curated search results

### 4. AI Source Verification

Each article is verified for credibility:

```javascript
{
  "shouldInclude": true,
  "trustScore": 85,
  "reasoning": "Article from WHO - highly credible health source"
}
```

### 5. RAG Fact-Checking

Verified sources are provided to the LLM for fact-checking:

```javascript
{
  "verdict": "false",
  "confidence": 0.95,
  "explanation": "No scientific evidence supports this claim...",
  "sources": [...]
}
```

### 6. Response Generation

A formatted evidence card is sent back to WhatsApp with verdict, explanation, and sources.

## 🔐 Environment Variables

### Required Variables

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Google Gemini (Primary LLM)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# At least ONE search API (all three recommended)
SERPAPI_KEY=your_serpapi_key
RAPIDAPI_KEY=your_rapidapi_key
TAVILY_API_KEY=your_tavily_key
```

### Optional Variables

```env
# HuggingFace (Fallback LLM)
HF_TOKEN=your_huggingface_token
HF_MODEL=meta-llama/Llama-3.3-70B-Instruct:novita

# ChromaDB (Vector Store)
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_COLLECTION_NAME=fact_check_sources

# Application Settings
PORT=3000
NODE_ENV=production
MAX_CLAIMS_PER_MESSAGE=3
CONFIDENCE_THRESHOLD=0.7
PRIMARY_LLM=gemini

# Search Configuration
SERPAPI_NEWS_RESULTS_LIMIT=10
SERPAPI_TRUST_THRESHOLD=70
```

## 📱 Usage Example

### Step 1: Send Message

User sends to WhatsApp: "Drinking hot water cures COVID-19"

### Step 2: Acknowledgment

```
🔍 Analyzing your message...
We're fact-checking the claims in your message. This may take a moment.
```

### Step 3: Evidence Card

```
❌ VERIFIED AS FALSE

📋 Claim:
Drinking hot water cures COVID-19

✅ Verdict: FALSE
📊 Confidence: 95%

💡 Explanation:
There is no scientific evidence that drinking hot water cures COVID-19.
The virus is treated through medical intervention and prevented through
vaccination and hygiene measures.

✏️ Correct Information:
COVID-19 can only be prevented through vaccination and following health
protocols including mask-wearing, social distancing, and hand hygiene.

📚 Sources:
1. Hot water does not cure COVID-19 - WHO Myth Busters
   https://www.who.int/emergencies/diseases/novel-coronavirus-2019

━━━━━━━━━━━━━━━
🤖 Crisis Cred - Misinformation Detection
⚠️ Always verify information from trusted sources.
```

## 🐛 Troubleshooting

### ChromaDB Connection Failed

**Symptom**: Warning about ChromaDB fallback mode

**Solutions**:

```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Start ChromaDB with Docker
docker run -p 8000:8000 chromadb/chroma

# Or update .env
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

### Twilio Webhook Not Receiving Messages

**Symptom**: Messages sent but no response

**Solutions**:

1. Verify webhook URL is publicly accessible
2. Check Twilio webhook logs in dashboard
3. Ensure webhook URL uses HTTPS (required for production)
4. Verify TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are correct

### LLM API Errors

**Symptom**: "LLM generation failed" in logs

**Solutions**:

```bash
# Verify Gemini API key
curl -H "x-goog-api-key: YOUR_KEY" https://generativelanguage.googleapis.com/v1/models

# Check HuggingFace token
curl -H "Authorization: Bearer YOUR_TOKEN" https://huggingface.co/api/whoami

# Switch between LLM providers
PRIMARY_LLM=huggingface  # or gemini
```

### Search API Limits Exceeded

**Symptom**: "API rate limit exceeded"

**Solutions**:

- Reduce `SERPAPI_NEWS_RESULTS_LIMIT` (default: 10)
- Enable only necessary search APIs
- Implement caching (future enhancement)

### Slow Response Times

**Symptom**: Responses take > 30 seconds

**Solutions**:

- Reduce `MAX_CLAIMS_PER_MESSAGE` to 1-2
- Use faster LLM (Gemini 2.5 Flash recommended)
- Deploy closer to your users (region selection)
- Enable only essential search APIs

## 🚀 Performance Optimization

### Recommended Configuration for Production

```env
# Fast LLM
PRIMARY_LLM=gemini
GEMINI_MODEL=gemini-2.5-flash

# Optimize claim processing
MAX_CLAIMS_PER_MESSAGE=2
CONFIDENCE_THRESHOLD=0.75

# Limit search results
SERPAPI_NEWS_RESULTS_LIMIT=5
```

### Response Time Breakdown

- Claim extraction: ~1-2 seconds
- Parallel news search: ~2-3 seconds
- Source verification: ~1-2 seconds
- Fact-checking: ~2-3 seconds
- **Total**: ~6-10 seconds

## 📊 Monitoring & Logging

### Log Levels

- **info**: Normal operations
- **warn**: Non-critical issues
- **error**: Critical failures

### View Logs

```bash
# Real-time logs
tail -f logs/app.log

# Error logs only
tail -f logs/error.log

# Filter by service
grep "fact-checking" logs/app.log
```

### Log Structure

```json
{
  "timestamp": "2025-12-22T10:30:00.000Z",
  "level": "info",
  "message": "Verifying claim",
  "claim": "Example claim text",
  "service": "fact-checking"
}
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Contains sensitive API keys
2. **Use environment variables** - For all credentials
3. **Enable webhook verification** - Re-enable Twilio signature check for production
4. **Implement rate limiting** - Prevent abuse
5. **Use HTTPS** - Required for Twilio webhooks
6. **Rotate API keys regularly** - Security maintenance
7. **Monitor logs** - Watch for suspicious activity

## 📚 Additional Resources

### Documentation Links

- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)
- [Google Gemini API](https://ai.google.dev/docs)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference)
- [ChromaDB Documentation](https://docs.trychroma.com/)
- [SerpAPI Documentation](https://serpapi.com/docs)
- [Tavily API Docs](https://docs.tavily.com/)

### Tutorials

- Setting up Twilio WhatsApp: [Tutorial](https://www.twilio.com/docs/whatsapp/tutorial/connect-number-business-profile)
- RAG Pipelines: [LangChain Guide](https://js.langchain.com/docs/)
- Vector Databases: [ChromaDB Guide](https://docs.trychroma.com/getting-started)

## 🎯 Use Cases

- **Health Information**: Verify medical claims and COVID-19 misinformation
- **Political Facts**: Check election and government-related claims
- **Crisis Communication**: Rapid fact-checking during emergencies
- **News Verification**: Validate viral news and social media posts
- **Educational**: Teaching media literacy and critical thinking
- **Community Moderation**: Help moderators verify user claims

## 🤝 Contributing

We welcome contributions! Here's how:

### Development Setup

```bash
# Fork and clone
git clone https://github.com/yourusername/crisis-cred-agent.git
cd crisis-cred-agent

# Create feature branch
git checkout -b feature/your-feature-name

# Install dependencies
npm install

# Make changes and test
npm run dev

# Commit and push
git add .
git commit -m "Add your feature"
git push origin feature/your-feature-name
```

### Contribution Guidelines

- Follow existing code style
- Add comments for complex logic
- Update README for new features
- Test thoroughly before submitting
- Write clear commit messages

## 📜 License

This project is licensed under the **ISC License**.

## 🙏 Acknowledgments

- **Meta/Facebook** - Twilio WhatsApp Business API
- **Google** - Gemini AI for fast and accurate LLM responses
- **HuggingFace** - LLaMA model access and inference infrastructure
- **ChromaDB Team** - Excellent vector database
- **LangChain** - LLM orchestration framework
- **SerpAPI, RapidAPI, Tavily** - News search services
- **Open Source Community** - For all the amazing tools

## 📞 Support & Contact

### Having Issues?

1. Check [Troubleshooting](#-troubleshooting) section
2. Review logs in `logs/` directory
3. Verify all environment variables are set
4. Check API service status pages

### Feature Requests

Open an issue on GitHub with:

- Clear description of the feature
- Use case and benefits
- Implementation suggestions (optional)

### Bug Reports

Include:

- Steps to reproduce
- Expected vs actual behavior
- Relevant logs
- Environment details (Node version, OS)

---

**Built with ❤️ to fight misinformation and promote verified information**

_Crisis Cred Agent - Making WhatsApp a safer place for information sharing_
