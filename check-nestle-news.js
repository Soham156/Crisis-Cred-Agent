require('dotenv').config();
const googleNewsService = require('./src/services/google-news.service');
const sourceVerificationService = require('./src/services/source-verification.service');
const factCheckingService = require('./src/services/fact-checking.service');
const responseBuilder = require('./src/services/response-builder.service');

async function checkNestleNews() {
    console.log('🔍 Fact-Checking: Arrest warrant issued for Nestle executives over substandard KitKats\n');
    console.log('='.repeat(80) + '\n');

    try {
        // Step 1: Search Google News
        console.log('📰 Step 1: Searching Google News...\n');
        const articles = await googleNewsService.searchNews('Nestle executives arrest warrant KitKat', { limit: 5 });

        if (articles.length === 0) {
            console.log('❌ No articles found on Google News.\n');
            console.log('This could indicate:');
            console.log('  - The story may be false or fabricated');
            console.log('  - The story is very recent and not yet indexed');
            console.log('  - The search terms need adjustment\n');
        } else {
            console.log(`✅ Found ${articles.length} related articles:\n`);

            // Display and verify top 3 articles
            for (let i = 0; i < Math.min(3, articles.length); i++) {
                const article = articles[i];
                console.log(`Article ${i + 1}:`);
                console.log(`  Title: ${article.title}`);
                console.log(`  Source: ${article.source}`);
                console.log(`  URL: ${article.link}`);
                console.log(`  Date: ${article.date}`);

                // Verify the article
                console.log('  Verifying...');
                const verification = await sourceVerificationService.verifyArticle(article);
                console.log(`  ✓ Trust Score: ${verification.trustScore}/100`);
                console.log(`  ✓ Include in Analysis: ${verification.shouldInclude ? 'Yes' : 'No'}\n`);
            }
        }

        console.log('─'.repeat(80) + '\n');

        // Step 2: Fact-check the claim
        console.log('🔬 Step 2: Fact-Checking the Claim...\n');
        const claim = 'Arrest warrant issued for Nestle executives over substandard KitKats';
        const result = await factCheckingService.verifyClaim(claim);

        // Step 3: Generate evidence card
        const evidenceCard = responseBuilder.buildEvidenceCard(claim, result);

        console.log('📋 EVIDENCE CARD:');
        console.log('─'.repeat(80));
        console.log(evidenceCard);
        console.log('─'.repeat(80) + '\n');

        // Additional context
        console.log('💡 Analysis Summary:');
        console.log(`  Verdict: ${result.verdict}`);
        console.log(`  Confidence: ${result.confidence}%`);
        console.log(`  Sources Found: ${result.sourcesFound || 0}`);
        console.log(`  Google News Articles: ${articles.length}\n`);

    } catch (error) {
        console.error('❌ Error during fact-check:', error.message);
        console.error(error);
    }

    process.exit(0);
}

// Run the check
checkNestleNews().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
