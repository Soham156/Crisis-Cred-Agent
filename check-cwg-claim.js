require('dotenv').config();
const factCheckingService = require('./src/services/fact-checking.service');
const logger = require('./src/utils/logger');

async function checkClaim() {
    const claim = "India clears Rs 23,280 cr plan to build rare earth magnet capacity";
    console.log(`\n🔍 Fact-Checking Claim: "${claim}"\n`);

    try {
        const result = await factCheckingService.verifyClaim(claim);

        console.log('\n----------------------------------------');
        console.log('📝 VERDICT:', result.verdict);
        console.log('📊 CONFIDENCE:', result.confidence + '%');
        console.log('----------------------------------------');
        console.log('\n💡 EXPLANATION:\n', result.explanation);

        if (result.correctedInfo) {
            console.log('\n✅ CORRECTED INFO:\n', result.correctedInfo);
        }

        console.log('\n📚 SOURCES USED:');
        result.sources.forEach((source, i) => {
            console.log(`${i + 1}. ${source.title} (${source.source})`);
            console.log(`   🔗 ${source.url}`);
        });

        console.log('\n----------------------------------------');
        console.log('🔎 SEARCH STATS:');
        console.log(`   • Sources Found: ${result.sourcesFound}`);
        console.log(`   • News APIs Used: ${result.newsAPIsUsed || 'N/A'}`);
        console.log(`   • Verified Articles: ${result.verifiedCount || 'N/A'}`);
        console.log('----------------------------------------\n');

    } catch (error) {
        console.error('Error:', error);
    }
}

checkClaim();
